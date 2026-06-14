# 📄 Smart PDF Q&A Bot — Full Stack

> A production-grade RAG application with a **React frontend** and **FastAPI backend**. Upload any PDF and ask natural language questions — answers are grounded strictly in your document.

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-teal?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![Claude](https://img.shields.io/badge/Claude-Sonnet-orange?style=flat-square)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│         (Vite · TailwindCSS · Axios)             │
└────────────────────┬────────────────────────────┘
                     │  REST API (JSON)
┌────────────────────▼────────────────────────────┐
│               FastAPI Backend                    │
│                                                  │
│  POST /upload  → PyMuPDF → LangChain chunks      │
│                          → HuggingFace embeds    │
│                          → FAISS index           │
│                                                  │
│  POST /ask     → FAISS retrieval (top-4 chunks)  │
│                → Claude Sonnet (RAG generation)  │
│                                                  │
│  GET  /sessions → session history                │
└─────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend UI | React 18 + Vite |
| Styling | TailwindCSS |
| HTTP Client | Axios |
| Markdown render | react-markdown |
| Backend API | FastAPI + Uvicorn |
| PDF Parsing | PyMuPDF (fitz) |
| Text Chunking | LangChain RecursiveCharacterTextSplitter |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` (local) |
| Vector Search | FAISS (Facebook AI Similarity Search) |
| LLM | Anthropic Claude Sonnet |

---

## 🚀 Running Locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env         # add your ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

API docs at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## 🌐 Deployment

### Backend → Render (free)
1. Push to GitHub
2. New Web Service on [render.com](https://render.com)
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env var: `ANTHROPIC_API_KEY`

### Frontend → Vercel (free)
1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set `VITE_API_URL` env var to your Render backend URL
4. Update `vite.config.js` proxy target accordingly

---

## 💼 Resume Description

> **Smart PDF Q&A Bot** | React · FastAPI · LangChain · FAISS · Claude Sonnet
>
> Built a full-stack RAG (Retrieval-Augmented Generation) application for natural language Q&A over PDF documents. React + Tailwind frontend communicates with a FastAPI REST backend that handles PDF ingestion (PyMuPDF), semantic chunking (LangChain), vector indexing (FAISS), and grounded answer generation (Claude Sonnet). Deployed on Vercel + Render.

---

## 📄 License
MIT
