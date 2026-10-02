"""FastAPI app: CORS, request_id, /health, /v1 router, demo page at /. Why: single entry."""
import uuid

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup (SQLite default; migrations later)."""
    init_db()
    yield


app = FastAPI(title="NicheDesk API", version="0.1.0", lifespan=lifespan)

from app.api.v1.routers import analytics, auth, billing, bots, chat, inbox, knowledge, leads, meta, playground, tenants
from app.core.config import settings
from app.core.db import init_db
from app.core.errors import make_error
from app.core.tenant import tenant_middleware

app = FastAPI(title="NicheDesk API", version="0.1.0", lifespan=lifespan)
app.middleware("http")(tenant_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def _request_id(request: Request, call_next):
    request.state.request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex[:12])
    return await call_next(request)


@app.exception_handler(Exception)
async def _exc_handler(request: Request, exc: Exception):
    from fastapi import HTTPException

    if isinstance(exc, HTTPException):
        return make_error("http_error", str(exc.detail), None, exc.status_code)
    return make_error("internal_error", str(exc)[:300], None, 500)


@app.get("/health")
def health():
    """Liveness probe."""
    return {"ok": True, "service": "nichedesk"}


for r in (auth.router, tenants.router, bots.router, knowledge.router, chat.router,
          inbox.router, leads.router, analytics.router, billing.router, playground.router, meta.router):
    app.include_router(r, prefix="/v1")


@app.get("/", response_class=HTMLResponse)
def demo():
    """Static demo widget page (no build step)."""
    return """<!doctype html><html><head><meta charset='utf-8'><title>NicheDesk Demo</title></head>
<body style='font-family:sans-serif;max-width:640px;margin:40px auto'>
<h1>NicheDesk widget demo</h1>
<input id='key' placeholder='bot public key' style='width:100%;padding:8px'/>
<div id='log' style='border:1px solid #ccc;height:300px;overflow:auto;padding:8px;margin:12px 0'></div>
<input id='msg' placeholder='Ask something...' style='width:80%;padding:8px'/>
<button onclick='send()'>Send</button>
<script>async function send(){const k=document.getElementById('key').value;
const m=document.getElementById('msg').value;const log=document.getElementById('log');
log.innerHTML+='<p><b>You:</b> '+m+'</p>';
const r=await fetch('/v1/bots/'+k+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({message:m,session_id:'demo'})});const j=await r.json();
log.innerHTML+='<p><b>Bot:</b> '+j.answer+' <small>(conf '+j.confidence+')</small></p>';}</script>
</body></html>"""
