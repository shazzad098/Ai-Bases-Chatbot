# Project Memory

> Living context file for the team **and AI coding assistants**. Read this first. Keep it short, current, and factual. Update it whenever a decision, assumption, or status changes.

---

## 1. Project Snapshot
- **Name (working):** NicheDesk
- **One-liner:** Subscription SaaS for niche-specific AI chatbots/support — starting with **E-commerce** and **Education**.
- **Primary market:** Bangladesh first (Bangla + English), expandable globally.
- **Stage:** Planning (docs v0.1)
- **Source-of-truth docs:** `prd.md` (what/why) • `architecture.md` (how) • `rules.md` (standards) • `design.md` (UX/UI) • `tasks.md` (plan)

## 2. Current Status
- **Active phase:** Phase 0–4 MVP Alpha scaffold BUILT & VERIFIED (2026-10-01)
- **What works:** FastAPI backend (SQLite, JWT auth, bots, knowledge TXT/upload/URL, RAG chat with citations + handoff, inbox, leads, billing stub, analytics, playground), Next.js dashboard (all IA pages, tsc clean), widget 5.35 KB gz Shadow DOM, CI + docker-compose + demo-data
- **Verified:** `pytest 2 passed`; live e2e: grounded answer `[1] ... conf 0.45 handoff False`, unknown → fallback + handoff True, analytics ok. Backend dev server on :8001.
- **Next up:** T-001 interviews, T-008 Bangla LLM benchmark, T-204 crawler, T-501 Stripe, T-601 security/load, real pgvector/Redis swap
- **Blockers:** none
- **Last updated:** 2026-10-01

## 3. Key Decisions (ADR Log)
| Date | Decision | Reason | Status |
|---|---|---|---|
| 2026-10-01 | Modular monolith for MVP | Speed, simplicity, small team | Accepted |
| 2026-10-01 | PostgreSQL + pgvector (no separate vector DB) | Fewer moving parts; enough scale for MVP | Accepted |
| 2026-10-01 | AI Gateway abstraction over provider SDKs | Avoid lock-in, fallback, cost control | Accepted |
| 2026-10-01 | RAG-only grounded answers + handoff fallback | Minimize hallucination risk | Accepted |
| 2026-10-01 | Row-Level Security for multi-tenancy | Strong isolation | Accepted |
| 2026-10-01 | Niche packs as versioned config bundles | Reuse core, ship niches fast | Accepted |
| 2026-10-01 | FastAPI + SQLite for local MVP (pgvector/Redis via docker-compose for staging) | Zero-dependency local run; no Docker on dev machine | Accepted |
| 2026-10-01 | Local hash-embedding + MockProvider as default AI path, OpenAI optional | Offline demo without API keys; gateway keeps fallback | Accepted |
| 2026-10-01 | Next.js dashboard + vanilla-TS Shadow DOM widget (5.35 KB gz) | Matches design.md constraints | Accepted |

*Add new rows at the bottom. Never delete — mark as "Superseded by …".*

## 4. Assumptions (to validate)
1. SMEs will pay $19–$149/month for niche-ready bots with minimal setup.
2. Bangla answer quality of the chosen LLM is good enough with RAG.
3. Web widget is the best first channel; Messenger/WhatsApp follow quickly.
4. A 30-minute onboarding is achievable with niche starter templates.
5. Local payment methods (bKash/Nagad) materially improve conversion in BD.

## 5. Open Questions
- Which LLM(s) offer the best cost/quality balance for Bangla?
- Per-conversation vs per-message billing?
- First integration: Shopify, WooCommerce, or Facebook-page-based sellers?
- Data residency requirements for education customers?

## 6. Glossary
| Term | Meaning |
|---|---|
| Tenant | A customer business/workspace on the platform |
| Bot | A configured chatbot belonging to a tenant |
| Niche pack | Versioned bundle of prompts, tools, forms, intents, KPIs for an industry |
| Knowledge source | Uploaded file, URL, or text used to ground answers |
| RAG | Retrieval-Augmented Generation |
| Handoff | Transfer from bot to a human agent |
| Resolution rate | % conversations resolved without human help |
| Deflection | Queries handled by bot that would otherwise reach staff |
| AI Gateway | Internal layer that wraps all LLM/embedding provider calls |

## 7. Conventions Cheat-Sheet
- Branches: `feat/T-123-name`; commits: Conventional Commits.
- Every table has `tenant_id`; every query is tenant-scoped.
- No direct LLM SDK calls outside the AI Gateway.
- All user-facing strings via i18n keys (EN + BN).
- Prompt/niche-pack changes require eval results in the PR.

## 8. Chatbot Memory Strategy (Product Feature)
How the **bot** remembers within and across conversations:
| Layer | Scope | Storage | Retention |
|---|---|---|---|
| Short-term | Last N turns of current session | Redis → Postgres | Session + 30 days |
| Conversation summary | Rolling summary for long chats | Postgres | Same as conversation |
| Customer profile (opt-in) | Name, contact, preferences, past orders | Postgres (encrypted fields) | Tenant policy; deletable on request |
| Tenant knowledge | Docs, FAQs, policies | pgvector | Until removed by tenant |
Rules: store only what is needed; never mix memory across tenants; honor deletion requests; mask PII in logs.

## 9. Risk Register (Top 5)
1. Hallucinations damaging tenant trust → evals + citations + handoff
2. LLM cost spikes → routing, caching, quotas
3. Weak differentiation vs generic tools → deep niche packs
4. Privacy/compliance concerns → isolation, retention controls, clear policy
5. Over-scoping the MVP → strict P0 list in `tasks.md`

## 10. Changelog
- **2026-10-01** — Initial documentation set created (v0.1): PRD, Architecture, Rules, Design, Tasks, Memory.
- **2026-10-01** — MVP Alpha scaffold built: backend/frontend/widget/infra + CI + demo-data; pytest 2 passed + live RAG e2e verified; tasks.md + memory.md updated.
