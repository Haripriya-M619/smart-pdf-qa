"""
Smart PDF Q&A Bot — FastAPI Backend
-------------------------------------
REST API that handles:
  - PDF upload & text extraction     (PyMuPDF)
  - Text chunking & vector indexing  (LangChain + FAISS)
  - Semantic retrieval               (HuggingFace embeddings)
  - Answer generation                (Anthropic Claude Sonnet)
  - Session / history management     (in-memory store)
"""
from dotenv import load_dotenv
load_dotenv()
import os
import uuid
import time
import datetime
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import fitz  # PyMuPDF
import anthropic

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Smart PDF Q&A API",
    description="RAG-powered PDF question answering using Claude Sonnet",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory stores ────────────────────────────────────────────────────────────
# In production, replace with Redis + persistent vector DB (e.g. Pinecone, Qdrant)

vectorstores: dict[str, FAISS] = {}      # session_id → FAISS index
sessions: dict[str, dict] = {}          # session_id → session metadata + history

# Shared embedding model (loaded once at startup)
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
)

# ── Schemas ────────────────────────────────────────────────────────────────────

class QuestionRequest(BaseModel):
    session_id: str
    question: str
    api_key: str=""

class QuestionResponse(BaseModel):
    answer: str
    sources: list[str]
    session_id: str

class SessionSummary(BaseModel):
    session_id: str
    filename: str
    pages: int
    created_at: str
    message_count: int
    title: str

# ── Helpers ────────────────────────────────────────────────────────────────────

def extract_text(pdf_bytes: bytes) -> tuple[str, dict]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    metadata = {
        "title": doc.metadata.get("title", ""),
        "author": doc.metadata.get("author", "Unknown"),
        "pages": doc.page_count,
    }
    text = ""
    for i, page in enumerate(doc, 1):
        t = page.get_text("text")
        if t.strip():
            text += f"\n\n[Page {i}]\n{t}"
    doc.close()
    return text.strip(), metadata


def build_index(text: str) -> FAISS:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n\n", "\n", ".", "!", "?", " "],
    )
    chunks = splitter.create_documents([text])
    return FAISS.from_documents(chunks, embeddings)


def retrieve(query: str, index: FAISS, k: int = 4) -> tuple[str, list[str]]:
    docs = index.similarity_search(query, k=k)
    snippets = [d.page_content for d in docs]
    return "\n\n---\n\n".join(snippets), snippets


def generate_answer(question, context, history, api_key):
    from groq import Groq
    client = Groq(api_key="GROQ_API_KEY")
    
    messages = [
        {
            "role": "system",
            "content": f"""You are a helpful assistant that answers questions based strictly on the provided document context.
            
Context from document:
{context}

Answer based only on the context above. If the answer isn't in the context, say so."""
        }
    ]
    
    for h in history:
        messages.append({"role": "user", "content": h["question"]})
        messages.append({"role": "assistant", "content": h["answer"]})
    
    messages.append({"role": "user", "content": question})
    
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1000,
    )
    
    return resp.choices[0].message.content

    system = f"""You are an expert document analyst. Answer ONLY from the PDF context below.
- Cite the page number when possible (e.g. "On page 3, ...")
- If not in the document, say: "I couldn't find that in the document."
- Be concise. Use bullet points for lists.
- Never hallucinate or use outside knowledge.

--- DOCUMENT CONTEXT ---
{context}
--- END CONTEXT ---"""

    messages = []
    for m in history[-6:]:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": question})

    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system,
        messages=messages,
    )
    return resp.content[0].text


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "message": "Smart PDF Q&A API is running"}


@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.datetime.utcnow().isoformat()}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF, extract text, build FAISS index. Returns a session_id."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 20 * 1024 * 1024:  # 20 MB limit
        raise HTTPException(status_code=413, detail="File too large. Max 20 MB.")

    text, meta = extract_text(pdf_bytes)
    if not text:
        raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

    index = build_index(text)
    session_id = str(uuid.uuid4())
    chunk_count = len(index.index_to_docstore_id)

    vectorstores[session_id] = index
    sessions[session_id] = {
        "session_id": session_id,
        "filename": file.filename,
        "pages": meta["pages"],
        "author": meta.get("author", ""),
        "title": meta.get("title", "") or file.filename,
        "chunk_count": chunk_count,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "history": [],
    }

    return {
        "session_id": session_id,
        "filename": file.filename,
        "pages": meta["pages"],
        "author": meta.get("author", ""),
        "chunk_count": chunk_count,
        "message": "PDF processed successfully.",
    }


@app.post("/ask", response_model=QuestionResponse)
def ask_question(req: QuestionRequest):
    """Ask a question about the uploaded PDF using RAG + Claude."""
    if req.session_id not in vectorstores:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")

    index = vectorstores[req.session_id]
    session = sessions[req.session_id]

    context, snippets = retrieve(req.question, index)
    answer = generate_answer(req.question, context, session["history"], req.api_key)

    # persist to history
    session["history"].append({"role": "user", "content": req.question})
    session["history"].append({"role": "assistant", "content": answer})

    return QuestionResponse(
        answer=answer,
        sources=[s[:200] for s in snippets[:2]],
        session_id=req.session_id,
    )


@app.get("/sessions", response_model=list[SessionSummary])
def list_sessions():
    """List all active sessions with metadata."""
    result = []
    for s in sessions.values():
        msg_count = len([m for m in s["history"] if m["role"] == "user"])
        first_q = next((m["content"] for m in s["history"] if m["role"] == "user"), "No questions yet")
        title = first_q[:50] + ("…" if len(first_q) > 50 else "")
        result.append(SessionSummary(
            session_id=s["session_id"],
            filename=s["filename"],
            pages=s["pages"],
            created_at=s["created_at"],
            message_count=msg_count,
            title=title,
        ))
    return sorted(result, key=lambda x: x.created_at, reverse=True)


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    """Get full chat history for a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    return sessions[session_id]


@app.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    """Delete a session and its vector index."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    del sessions[session_id]
    del vectorstores[session_id]
    return {"message": "Session deleted."}
