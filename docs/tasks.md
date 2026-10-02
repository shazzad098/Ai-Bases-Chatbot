# Tasks & Roadmap

**Product:** NicheDesk | **Last updated:** 2026-10-01 (MVP Alpha scaffold built + verified: pytest 2 passed, live RAG e2e ok)
**Status legend:** `[ ]` todo • `[~]` in progress • `[x]` done • Priority: P0 (must), P1 (should), P2 (nice)
**Estimates:** S ≤ 1 day, M = 2–3 days, L = 4–7 days, XL = 1–2 weeks

---

## Phase 0 — Validation & Setup (Weeks 1–2)
| ID | Task | Pri | Est | Status |
|---|---|---|---|---|
| T-001 | Interview 10–15 target users (5 e-commerce, 5 education, 5 mixed) | P0 | L | [ ] |
| T-002 | Competitor analysis (Tidio, Intercom Fin, Chatfuel, local BD tools) | P0 | M | [ ] |
| T-003 | Finalize product name, domain, brand basics | P1 | S | [ ] |
| T-004 | Validate pricing hypothesis with interview data | P0 | M | [ ] |
| T-005 | Create repo, monorepo structure, README, `.env.example` | P0 | S | [x] |
| T-006 | Set up CI (lint, type-check, tests), pre-commit hooks | P0 | M | [x] |
| T-007 | Docker-compose local env (Postgres+pgvector, Redis, storage emulator) | P0 | M | [x] |
| T-008 | Choose LLM/embedding providers; benchmark Bangla quality & cost | P0 | M | [ ] |

## Phase 1 — Foundation (Weeks 3–5)
| ID | Task | Pri | Est | Status |
|---|---|---|---|---|
| T-101 | DB schema + migrations for core entities | P0 | M | [x] |
| T-102 | Row-Level Security policies + tenant context middleware | P0 | M | [x] |
| T-103 | Auth: signup, login, email verify, password reset, Google OAuth | P0 | L | [x] |
| T-104 | Workspace/tenant creation, roles (Owner/Admin/Agent), invites | P0 | M | [x] |
| T-105 | Bot CRUD + public key + domain allowlist | P0 | M | [x] |
| T-106 | AI Gateway (provider abstraction, retries, fallback, metering) | P0 | L | [x] |
| T-107 | Design system setup (tokens, base components, dark mode) | P0 | L | [x] |
| T-108 | Dashboard shell: layout, navigation, i18n (EN/BN) | P0 | M | [x] |
| T-109 | Observability baseline (logging, Sentry, tracing, request IDs) | P1 | M | [ ] |

## Phase 2 — Knowledge & RAG Core (Weeks 6–8)
| ID | Task | Pri | Est | Status |
|---|---|---|---|---|
| T-201 | Source upload (PDF/DOCX/CSV/TXT) to object storage | P0 | M | [x] |
| T-202 | Parsers + cleaners + chunking strategy | P0 | L | [x] |
| T-203 | Embedding job pipeline with status tracking and retries | P0 | L | [x] |
| T-204 | Website crawler (URL → pages, robots.txt, dedupe, hash) | P1 | L | [ ] |
| T-205 | Hybrid retrieval (BM25 + vector) + reranking | P0 | L | [x] |
| T-206 | AI Orchestrator: prompt assembly, citations, confidence, fallback | P0 | XL | [x] |
| T-207 | Guardrails: prompt-injection, PII masking, topic/policy filters | P0 | L | [x] |
| T-208 | Playground UI (chat + retrieved sources + confidence) | P0 | M | [x] |
| T-209 | Golden eval set (50+ Q&A per niche) + automated eval runner | P0 | L | [ ] |

## Phase 3 — Chat Experience (Weeks 9–10)
| ID | Task | Pri | Est | Status |
|---|---|---|---|---|
| T-301 | Chat service (WebSocket/SSE streaming, sessions, rate limiting) | P0 | L | [x] |
| T-302 | Embeddable widget (Shadow DOM, < 60 KB, theming) | P0 | XL | [x] |
| T-303 | Appearance editor with live preview | P0 | M | [x] |
| T-304 | Install page (snippet, verification check) | P0 | S | [x] |
| T-305 | Feedback (👍/👎), conversation persistence | P0 | M | [x] |
| T-306 | Language auto-detect and Bangla/English response handling | P0 | M | [x] |

## Phase 4 — Handoff, Inbox & Niche Packs (Weeks 11–13)
| ID | Task | Pri | Est | Status |
|---|---|---|---|---|
| T-401 | Handoff triggers + agent notification (in-app + email) | P0 | L | [x] |
| T-402 | Inbox UI: list, transcript, assign, tag, notes, canned replies | P0 | XL | [x] |
| T-403 | Lead capture forms + leads table + CSV export | P0 | M | [x] |
| T-404 | Niche pack framework (config loader, versioning, flags) | P0 | L | [x] |
| T-405 | **E-commerce pack:** product Q&A, return policy flow, order-status tool (manual/CSV + API stub) | P0 | XL | [x] |
| T-406 | **Education pack:** admission FAQ, fees, course search, inquiry form | P0 | L | [x] |
| T-407 | Onboarding wizard + setup checklist per niche | P0 | L | [x] |

## Phase 5 — Billing, Analytics & Admin (Weeks 14–16)
| ID | Task | Pri | Est | Status |
|---|---|---|---|---|
| T-501 | Plans, trial, subscription lifecycle (Stripe Billing) | P0 | XL | [x] |
| T-502 | Local payment option (SSLCommerz / bKash) feasibility + integration | P1 | L | [ ] |
| T-503 | Usage metering + plan limit enforcement + overage handling | P0 | L | [x] |
| T-504 | Invoices, receipts, dunning emails | P1 | M | [ ] |
| T-505 | Analytics: KPIs, trends, top/unanswered questions | P0 | L | [x] |
| T-506 | Admin console: tenants, usage, feature flags, abuse review | P1 | L | [ ] |
| T-507 | Transactional emails (verify, invite, handoff, billing) | P0 | M | [ ] |

## Phase 6 — Hardening & Launch (Weeks 17–19)
| ID | Task | Pri | Est | Status |
|---|---|---|---|---|
| T-601 | Security review, dependency scan, pen-test checklist | P0 | L | [ ] |
| T-602 | Load test chat + ingestion at target scale | P0 | M | [ ] |
| T-603 | Backup/restore drill, incident runbook, status page | P0 | M | [ ] |
| T-604 | Legal: Terms, Privacy Policy, DPA, cookie notice | P0 | M | [ ] |
| T-605 | Docs site: quick start, niche guides, API reference | P1 | L | [ ] |
| T-606 | Landing page + pricing page + demo bot | P0 | L | [ ] |
| T-607 | Private beta with 5–10 pilot tenants; weekly feedback loop | P0 | XL | [ ] |
| T-608 | Public launch checklist & monitoring on-call plan | P0 | M | [ ] |

## Phase 7 — Post-Launch Backlog
- [ ] T-701 Facebook Messenger channel (P1)
- [ ] T-702 WhatsApp Business channel (P1)
- [ ] T-703 Shopify & WooCommerce integrations (P1)
- [ ] T-704 Public API + webhooks (P1)
- [ ] T-705 Proactive messages / cart-recovery (P2)
- [ ] T-706 LMS integrations (P2)
- [ ] T-707 Conversation summaries & auto-tagging (P2)
- [ ] T-708 White-label / reseller program (P2)

## Milestones
| Milestone | Target | Exit Criteria |
|---|---|---|
| M1 — Alpha | End of Week 10 | Widget answers from uploaded KB on one tenant |
| M2 — Private Beta | End of Week 13 | Handoff + both niche packs working with pilots |
| M3 — Launch | End of Week 19 | Billing live, security checks done, ≥ 10 trial signups |

## Working Agreement
- Pick tasks by phase order; move status as you go; link PRs to task IDs.
- New work discovered → add a task here and note rationale in `memory.md`.
