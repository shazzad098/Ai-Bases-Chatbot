"""Knowledge ingestion: text/file/url + search test. Why: sync MVP (jobs later)."""
import hashlib
import urllib.request

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import make_error
from app.core.tenant import get_current_tenant, get_current_user
from app.models import Bot, KnowledgeChunk, KnowledgeSource
from app.modules.knowledge import service as ks

router = APIRouter(tags=["knowledge"])


class TextIn(BaseModel):
    bot_id: str
    text: str = Field(min_length=1, max_length=100000)
    title: str = Field(default="pasted-text", max_length=255)


class UrlIn(BaseModel):
    bot_id: str
    url: str = Field(min_length=8, max_length=2000)


class SeedIn(BaseModel):
    bot_id: str
    niche: str = Field(default="ecommerce", max_length=64)


def _get_bot(db: Session, bot_id: str, tenant_id: str) -> Bot | None:
    return db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()


def _ingest(db: Session, tenant_id: str, bot: Bot, kind: str, uri: str, text: str) -> dict:
    """Dedupe by content hash, then chunk+embed+store (idempotent per content)."""
    text = ks.clean_text(text, keep_lines=True)
    if not text:
        return make_error("empty_content", "No extractable text found", None, 400)  # type: ignore[return-value]
    h = hashlib.sha256(text.encode()).hexdigest()
    dup = db.query(KnowledgeSource).filter(
        KnowledgeSource.tenant_id == tenant_id, KnowledgeSource.bot_id == bot.id,
        KnowledgeSource.content_hash == h).first()
    if dup:
        return {"source_id": dup.id, "status": "duplicate", "chunks": 0}
    src = KnowledgeSource(tenant_id=tenant_id, bot_id=bot.id, type=kind, uri=uri, status="ready", content_hash=h)
    db.add(src)
    db.flush()
    n = ks.store_chunks(db, tenant_id, bot.id, src.id, text)
    return {"source_id": src.id, "status": "ready", "chunks": n}


@router.post("/knowledge/text")
def add_text(body: TextIn, db: Session = Depends(get_db), user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """Ingest pasted text for a bot."""
    bot = _get_bot(db, body.bot_id, tenant_id)
    if not bot:
        return make_error("not_found", "Bot not found", None, 404)
    return _ingest(db, tenant_id, bot, "text", body.title, body.text)


@router.post("/knowledge/upload")
def upload(bot_id: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db),
            user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """Ingest pdf/docx/csv/txt upload."""
    bot = _get_bot(db, bot_id, tenant_id)
    if not bot:
        return make_error("not_found", "Bot not found", None, 404)
    raw = file.file.read()
    try:
        text = ks.parse_file(file.filename or "file.txt", raw)
    except Exception as e:
        return make_error("parse_error", f"Could not parse file: {e}", None, 400)
    return _ingest(db, tenant_id, bot, "file", file.filename or "", text)


@router.post("/knowledge/url")
def add_url(body: UrlIn, db: Session = Depends(get_db), user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """Fetch a URL (5s timeout) and ingest its text."""
    from html.parser import HTMLParser

    bot = _get_bot(db, body.bot_id, tenant_id)
    if not bot:
        return make_error("not_found", "Bot not found", None, 404)

    class Stripper(HTMLParser):
        def __init__(self) -> None:
            super().__init__()
            self.parts: list[str] = []

        def handle_data(self, d: str) -> None:
            self.parts.append(d)

    try:
        req = urllib.request.Request(body.url, headers={"User-Agent": "NicheDeskBot/1.0"})
        with urllib.request.urlopen(req, timeout=5) as r:  # noqa: S310 (validated tenant URL fetch)
            html = r.read().decode("utf-8", errors="ignore")
        s = Stripper()
        s.feed(html)
        text = ks.clean_text(" ".join(s.parts))[:50000]
    except Exception as e:
        return make_error("fetch_error", f"URL fetch failed: {e}", None, 400)
    return _ingest(db, tenant_id, bot, "url", body.url, text)


@router.get("/knowledge")
def list_sources(bot_id: str, db: Session = Depends(get_db), user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """List knowledge sources for a bot."""
    rows = db.query(KnowledgeSource).filter(
        KnowledgeSource.tenant_id == tenant_id, KnowledgeSource.bot_id == bot_id).all()
    return {"sources": [{"id": s.id, "type": s.type, "uri": s.uri, "status": s.status} for s in rows]}


@router.get("/knowledge/sources")
def list_sources_alias(bot_id: str = "", db: Session = Depends(get_db), user=Depends(get_current_user),
                       tenant_id: str = Depends(get_current_tenant)):
    """Alias of GET /knowledge?bot_id= kept for dashboard compatibility."""
    return list_sources(bot_id, db, user, tenant_id)


@router.post("/knowledge/seed-demo")
def seed_demo(body: SeedIn, db: Session = Depends(get_db), user=Depends(get_current_user),
              tenant_id: str = Depends(get_current_tenant)):
    """One-click sample FAQs for a bot (idempotent via content-hash dedupe)."""
    from pathlib import Path

    bot = _get_bot(db, body.bot_id, tenant_id)
    if not bot:
        return make_error("not_found", "Bot not found", None, 404)
    fname = "education_faq.csv" if body.niche == "education" else "ecommerce_faq.csv"
    here = Path(__file__).resolve()
    candidates = [here.parents[5] / "demo-data" / fname, here.parents[4] / "demo-data" / fname]
    raw = None
    for p in candidates:
        if p.is_file():
            raw = p.read_bytes()
            break
    if raw is None:
        return make_error("seed_missing", f"Demo file {fname} not found", None, 500)
    text = ks.parse_file(fname, raw)
    return _ingest(db, tenant_id, bot, "file", f"demo-data/{fname}", text)


@router.delete("/knowledge/{source_id}")
def delete_source(source_id: str, db: Session = Depends(get_db), user=Depends(get_current_user),
                  tenant_id: str = Depends(get_current_tenant)):
    """Delete a source and its chunks (tenant-scoped). Why: re-ingest after parser upgrades."""
    src = db.query(KnowledgeSource).filter(
        KnowledgeSource.id == source_id, KnowledgeSource.tenant_id == tenant_id).first()
    if not src:
        return make_error("not_found", "Source not found", None, 404)
    db.query(KnowledgeChunk).filter(KnowledgeChunk.source_id == source_id).delete()
    db.delete(src)
    db.commit()
    return {"ok": True}


@router.post("/knowledge/test-search")
def test_search(body: TextIn, db: Session = Depends(get_db), user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """Debug hybrid retrieval without generation (shows scores)."""
    bot = _get_bot(db, body.bot_id, tenant_id)
    if not bot:
        return make_error("not_found", "Bot not found", None, 404)
    rows = db.query(KnowledgeChunk).filter(
        KnowledgeChunk.tenant_id == tenant_id, KnowledgeChunk.bot_id == bot.id).all()
    hits = ks.hybrid_search(body.text, rows, top_k=4)
    return {"hits": [{"content": h.content[:300], "score": round(h.score, 3)} for h in hits]}
