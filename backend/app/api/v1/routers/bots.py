"""Bots CRUD + public-key rotation. Why: niche pack stored as config_json."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import make_error
from app.core.security import new_public_key
from app.core.tenant import get_current_tenant, get_current_user
from app.models import Bot
from app.modules.niche_packs.packs import get_pack

router = APIRouter(tags=["bots"])


class BotIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    niche: str = Field(default="ecommerce", max_length=64)
    allowed_domains: list[str] = Field(default_factory=list)


@router.post("/bots")
def create_bot(body: BotIn, db: Session = Depends(get_db), user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """Create a bot bound to the caller's tenant with its niche pack defaults."""
    pack = get_pack(body.niche)
    bot = Bot(tenant_id=tenant_id, name=body.name, niche=body.niche.lower(),
              config_json={"pack_id": pack["id"], "quick_replies": pack["quick_replies"]},
              public_key=new_public_key(), allowed_domains=body.allowed_domains)
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return {"id": bot.id, "name": bot.name, "niche": bot.niche, "public_key": bot.public_key}


@router.get("/bots")
def list_bots(db: Session = Depends(get_db), user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """List bots for this tenant only."""
    rows = db.query(Bot).filter(Bot.tenant_id == tenant_id).all()
    return {"bots": [{"id": b.id, "name": b.name, "niche": b.niche, "public_key": b.public_key} for b in rows]}


@router.get("/bots/{bot_id}")
def get_bot(bot_id: str, db: Session = Depends(get_db), user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """Fetch one bot (tenant-scoped)."""
    b = db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    if not b:
        return make_error("not_found", "Bot not found", None, 404)
    return {"id": b.id, "name": b.name, "niche": b.niche, "public_key": b.public_key,
            "allowed_domains": b.allowed_domains, "config": b.config_json}


@router.post("/bots/{bot_id}/regenerate-key")
def regen_key(bot_id: str, db: Session = Depends(get_db), user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """Rotate the widget public key."""
    b = db.query(Bot).filter(Bot.id == bot_id, Bot.tenant_id == tenant_id).first()
    if not b:
        return make_error("not_found", "Bot not found", None, 404)
    b.public_key = new_public_key()
    db.commit()
    return {"public_key": b.public_key}
