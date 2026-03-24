import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, text
from dotenv import load_dotenv

from .database import engine
from .routers import auth, employees, projects

load_dotenv()

app = FastAPI(title="TeamForge — AI-Powered Team Allocator")

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── DB Init ───────────────────────────────────────────────────────────────────
with Session(engine) as session:
    session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
    session.commit()

SQLModel.metadata.create_all(engine)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(projects.router)

from .routers import me
app.include_router(me.router)

@app.get("/")
def read_root():
    return {"message": "TeamForge backend running", "version": "2.0"}