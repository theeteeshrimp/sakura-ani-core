from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from uuid import uuid4
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "db.json"
WEB_DIR = ROOT / "web"

app = FastAPI(title="Sakura Ani Core")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_db():
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text(json.dumps({
            "profile": {
                "vibe": "energetic",
                "emoji_level": "high",
                "directness": "balanced",
                "name": "SakuraAni"
            },
            "sessions": {}
        }, indent=2))


def read_db():
    ensure_db()
    return json.loads(DATA_FILE.read_text())


def write_db(db):
    DATA_FILE.write_text(json.dumps(db, indent=2))


def decorate_reply(base: str, profile: dict) -> str:
    vibe = profile.get("vibe", "energetic")
    emoji = profile.get("emoji_level", "medium")
    direct = profile.get("directness", "balanced")

    text = base
    if vibe == "energetic":
        text = f"Yoo~ {text}"
    elif vibe == "mentor":
        text = f"Let's do this step-by-step. {text}"

    if direct == "blunt":
        text = text.replace("Maybe", "Do this")

    if emoji == "high":
        text += " 🌸✨"

    return text


class ProfileIn(BaseModel):
    vibe: str | None = None
    emoji_level: str | None = None
    directness: str | None = None
    name: str | None = None


class ChatIn(BaseModel):
    sessionId: str | None = None
    message: str


@app.get("/api/health")
def health():
    return {"ok": True, "app": "sakura-ani-core", "backend": "python-fastapi"}


@app.get("/api/profile")
def get_profile():
    db = read_db()
    return db["profile"]


@app.post("/api/profile")
def set_profile(payload: ProfileIn):
    db = read_db()
    profile = db["profile"]
    for k, v in payload.model_dump().items():
        if v is not None:
            profile[k] = v
    db["profile"] = profile
    write_db(db)
    return profile


@app.post("/api/chat")
def chat(payload: ChatIn):
    db = read_db()
    msg = payload.message.strip()
    if not msg:
        return {"error": "message required"}

    sid = payload.sessionId or str(uuid4())
    sessions = db["sessions"]
    if sid not in sessions:
        sessions[sid] = []

    sessions[sid].append({"role": "user", "text": msg})

    mem_hint = ""
    if len(sessions[sid]) > 1:
        mem_hint = f'I remember we were talking about: "{sessions[sid][-2]["text"]}". '

    base = f'{mem_hint}You said: "{msg}". I can help plan this into next actions.'
    reply = decorate_reply(base, db["profile"])

    sessions[sid].append({"role": "assistant", "text": reply})
    db["sessions"] = sessions
    write_db(db)

    return {"sessionId": sid, "reply": reply, "profile": db["profile"]}


@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    db = read_db()
    return {"sessionId": session_id, "messages": db["sessions"].get(session_id, [])}


if WEB_DIR.exists():
    app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")
