# NicheDesk — niche-aware AI support chatbot SaaS (E-commerce & Education)

Non-technical shop/school owners get a working support bot in ~30 minutes:
upload knowledge → preview in Playground → copy one-line widget snippet → go live.

## Quickstart

**Backend (FastAPI):**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend (Next.js dashboard):**
```bash
cd frontend
npm install && npm run dev
```

**Widget:**
```bash
cd widget
npm install && npm run build
```
Then embed:
```html
<script async src="./dist/nichedesk-widget.js"></script>
<nichedesk-widget bot-key="pk_test_..." api="http://localhost:8000" niche="ecommerce"></nichedesk-widget>
```

**Local infra (optional):** `docker compose up -d` for Postgres+pgvector & Redis.
Without Docker set `USE_SQLITE=1` for API dev fallback (see `.env.example`).

## Demo flow

1. **Signup** → create workspace → choose niche (E-commerce / Education).
2. **Knowledge** → upload `demo-data/ecommerce_faq.csv` or paste `demo-data/sample_policy.txt`.
3. **Chat** → ask in Playground/widget ("Track my order" / "ভর্তি ফি কত?") — streaming answer with source chips.
4. **Handoff** → click "Talk to a human" → agent sees transcript + AI summary in Inbox → resolves → bot resumes.

## API overview (`/v1`)

| Method | Path | Description |
|---|---|---|
| POST | `/v1/auth/signup`, `/v1/auth/login` | Auth + JWT |
| CRUD | `/v1/bots` | Bot config, niche, theme |
| CRUD | `/v1/knowledge/sources` | Upload/URL/text sources, status |
| POST | `/v1/chat` | Chat (SSE `text/event-stream` when `stream:true`, JSON fallback) |
| GET/POST | `/v1/conversations`, `/v1/conversations/:id/messages` | History |
| POST | `/v1/handoff` | Escalate to human |
| POST | `/v1/leads` | Lead capture (incl. widget offline form) |
| POST | `/v1/feedback` | 👍/👎 on messages |
| GET | `/v1/analytics/*` | Resolution, CSAT, top/unanswered |

Full contracts: `docs/prd.md`, `docs/architecture.md`, `docs/design.md`.

## Repo layout

- `backend/` — FastAPI modular monolith (other agent)
- `frontend/` — Next.js dashboard (other agent)
- `widget/` — embeddable `<nichedesk-widget>` custom element
- `demo-data/` — sample FAQs/policies for onboarding tests
- `docs/` — PRD, architecture, design, tasks
