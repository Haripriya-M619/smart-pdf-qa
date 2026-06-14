# Smart PDF Q&A Bot 🤖

A full-stack RAG (Retrieval-Augmented Generation) application that lets you upload any PDF and ask questions about it using AI.

## Tech Stack
- **Frontend:** React, TailwindCSS, Vite
- **Backend:** FastAPI, Python
- **AI/ML:** LangChain, FAISS, HuggingFace Embeddings, Groq LLaMA
- **Architecture:** RAG (Retrieval-Augmented Generation)

## Features
- Upload any PDF and ask questions about it
- Semantic search using FAISS vector store
- Conversation history
- Source citations
- Session management

## Screenshots

<img width="1912" height="947" alt="Screenshot 2026-06-14 124605" src="https://github.com/user-attachments/assets/e9d45c4e-763d-413c-a0f2-6d6f180642a7" />

<img width="1918" height="938" alt="Screenshot 2026-06-14 124713" src="https://github.com/user-attachments/assets/e686733d-fd3a-41da-b2f9-da7d90ce1948" />

<img width="1909" height="946" alt="Screenshot 2026-06-14 124846" src="https://github.com/user-attachments/assets/a51cd6b2-d566-49e6-8565-b9193cbeb5f7" />

<img width="1890" height="930" alt="Screenshot 2026-06-14 124546" src="https://github.com/user-attachments/assets/4de7bef9-9152-4854-9ad1-9b3c6c2fc625" />

<img width="1497" height="533" alt="Screenshot 2026-06-14 124222" src="https://github.com/user-attachments/assets/7ab96ceb-09c8-4a36-9355-610425176263" />


## How to Run

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Architecture
User → React Frontend → FastAPI Backend → LangChain RAG Pipeline → Groq LLaMA
