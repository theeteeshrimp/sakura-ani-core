# Sakura Ani Core 🌸🤖

Experimental scaffold for building an anime-style AI assistant app (Grok Ani inspired).

## Stack
- **Backend:** Python + FastAPI
- **Frontend:** static HTML prototype (`web/`)
- **Storage:** local JSON (`data/db.json`)

## Run
```bash
cd sakura-ani-core
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8899 --reload
```

Open: `http://localhost:8899`

## API
- `GET /api/health`
- `GET /api/profile`
- `POST /api/profile`
- `POST /api/chat`
- `GET /api/session/{id}`

## Vision
- Anime persona + expressive tone layer
- Tool-using agent backend
- Chat UI + memory + optional image features
- Fast local iteration
