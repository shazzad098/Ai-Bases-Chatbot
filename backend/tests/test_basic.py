"""E2E basics: signup->tenant->bot->knowledge->chat citation->fallback->handoff->isolation."""
import os

# Isolate tests on their own SQLite file — NEVER wipe the dev database.
os.environ["DATABASE_URL"] = "sqlite:///./test_nichedesk.db"

from fastapi.testclient import TestClient

from app.core.db import Base, engine
from app.main import app

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def _signup(email: str, workspace: str = "Shop") -> tuple[str, str, str]:
    r = client.post("/v1/auth/signup", json={"email": email, "password": "secret123", "workspace": workspace})
    assert r.status_code == 200, r.text
    j = r.json()
    return j["token"], j["tenant_id"], j["user"]["id"]


def _auth(token: str, tenant: str) -> dict:
    return {"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant}


def test_full_flow() -> None:
    token, tenant, _ = _signup("owner1@test.com")
    h = _auth(token, tenant)

    r = client.post("/v1/bots", json={"name": "ShopBot", "niche": "ecommerce"}, headers=h)
    assert r.status_code == 200, r.text
    bot, pkey = r.json()["id"], r.json()["public_key"]

    text = "Our return policy: returns accepted within 30 days with receipt. Delivery charge is 60 taka inside Dhaka."
    r = client.post("/v1/knowledge/text", json={"bot_id": bot, "text": text}, headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["chunks"] >= 1

    # Known question -> grounded answer with citation
    r = client.post(f"/v1/bots/{pkey}/chat", json={"message": "What is the return policy?", "session_id": "s1"})
    assert r.status_code == 200, r.text
    j = r.json()
    assert "30 days" in j["answer"], j
    assert ("Source" in j["answer"] or "[1]" in j["answer"]) or len(j["sources"]) > 0
    assert j["handoff"] is False

    # Unknown question -> fallback + handoff
    r = client.post(f"/v1/bots/{pkey}/chat", json={"message": "What is the capital of Mars?", "session_id": "s1"})
    assert r.status_code == 200, r.text
    j = r.json()
    assert "don't have" in j["answer"] or "নেই" in j["answer"]
    assert j["handoff"] is True

    # Human request -> handoff with reason
    r = client.post(f"/v1/bots/{pkey}/chat", json={"message": "I want to talk to a human agent please", "session_id": "s2"})
    assert r.json()["handoff"] is True
    assert r.json()["handoff_reason"] == "user_requested_human"

    # Tenant isolation: second tenant cannot see first tenant's bot
    token2, tenant2, _ = _signup("owner2@test.com", "Other")
    h2 = _auth(token2, tenant2)
    r = client.get(f"/v1/bots/{bot}", headers=h2)
    assert r.status_code == 404, r.text
    r = client.post("/v1/knowledge/test-search", json={"bot_id": bot, "text": "return"}, headers=h2)
    assert r.status_code == 404, r.text


def test_language_and_validation() -> None:
    from app.modules.chat.orchestrator import detect_language, route_intent

    assert detect_language("ফেরত নীতি কি?") == "bn"
    assert detect_language("What is the fee?") == "en"
    assert route_intent("talk to a human", "ecommerce") == "human"
    assert route_intent("track my order please", "ecommerce") == "order"
