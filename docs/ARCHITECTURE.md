# Architecture Draft

## Components
1. Frontend chat client
2. Backend orchestrator
3. Persona/profile module
4. Memory store (json/sqlite)
5. Tool adapters (web, calendar, media)

## Suggested MVP Stack
- Backend: FastAPI or Express
- Frontend: Vite + React
- Storage: SQLite
- Deployment: Docker + reverse proxy

## API Draft
- `POST /api/chat`
- `GET /api/session/:id`
- `POST /api/profile`
- `GET /api/health`
