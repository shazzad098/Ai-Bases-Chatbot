# NicheDesk Backend

Modular monolith (FastAPI + SQLAlchemy + SQLite by default).

## Quick start (Windows, no Docker)

```powershell
cd backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Open: http://127.0.0.1:8000/ (demo widget page), docs at /docs, health at /health.

## Run tests

```powershell
python -m pytest tests -q
```

## Env vars

See `.env.example`. SQLite is default (`DATABASE_URL=sqlite:///./nichedesk.db`).
Set `OPENAI_API_KEY` to use the OpenAI-compatible provider; otherwise the
offline `MockProvider` answers extractively from retrieved chunks.

## API versioning

All APIs under `/v1`. Errors use `{code, message, details, request_id}`.
Multi-tenant: pass `X-Tenant-ID` header on authed routes; every row is
filtered by `tenant_id`. Public widget chat uses `POST /v1/bots/{public_key}/chat`.
