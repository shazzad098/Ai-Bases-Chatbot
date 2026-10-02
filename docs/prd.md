# Product Requirements Document (PRD)

**Product (working name):** NicheDesk — Niche AI Chatbot & Support Platform
**Version:** 0.1 (Draft) | **Owner:** Product | **Status:** In planning

---

## 1. Overview
NicheDesk is a subscription-based SaaS that lets small and mid-size businesses launch an AI-powered chatbot and support assistant in minutes. Unlike generic chatbot builders, NicheDesk ships **niche packs** (starting with **E-commerce** and **Education**) that come pre-configured with industry workflows, intents, prompts, integrations and analytics.

## 2. Problem Statement
- SMEs receive repetitive support queries (order status, price, return policy, admission info, course schedule) that consume staff time.
- Generic chatbot tools need heavy setup, produce hallucinated answers, and don't understand industry workflows.
- Customers expect instant replies on chat channels (website, Messenger, WhatsApp), often in local language (Bangla + English mix).

## 3. Goals & Non-Goals
### Goals
1. Reduce first-response time to < 5 seconds, 24/7.
2. Automatically resolve ≥ 60% of repetitive queries without human help.
3. Onboard a new customer (knowledge base + live widget) in < 30 minutes.
4. Generate recurring revenue via tiered subscriptions.

### Non-Goals (MVP)
- Voice/phone bot.
- Fully custom enterprise workflows / on-prem deployment.
- Building our own LLM (we use third-party LLM APIs).

## 4. Target Users & Personas
| Persona | Description | Key Need |
|---|---|---|
| **Shop Owner (E-commerce)** | Runs online store (Shopify/WooCommerce/Facebook page) | Answer product, order, delivery, return questions automatically |
| **Education Admin** | School/coaching/university/online-course operator | Handle admission, fees, schedules, course FAQs |
| **Support Agent** | Staff member on the customer side | Take over from bot with full context |
| **End Customer / Student** | Chats with the bot | Fast, accurate, polite answers |
| **Platform Admin (us)** | Internal team | Manage tenants, billing, abuse, quality |

## 5. Scope — Features
### 5.1 MVP (P0)
| ID | Feature | Description |
|---|---|---|
| FR-01 | Tenant onboarding | Sign up, create workspace, choose niche pack |
| FR-02 | Knowledge base ingestion | Upload PDF/DOCX/CSV, paste text, crawl website URL |
| FR-03 | RAG-based answering | Bot answers only from tenant knowledge + tools, with source citations |
| FR-04 | Embeddable web widget | One-line script, customizable colors/logo/greeting |
| FR-05 | Human handoff | Escalate to agent when confidence low or user asks; transcript passed |
| FR-06 | Conversation inbox | Agents view, reply, tag, and close conversations |
| FR-07 | Niche pack: E-commerce | Product Q&A, order-status lookup, return/refund policy flow, lead capture |
| FR-08 | Niche pack: Education | Course/admission FAQ, fee info, schedule, inquiry-to-lead form |
| FR-09 | Subscription billing | Plans, free trial, upgrade/downgrade, invoices, usage limits |
| FR-10 | Analytics dashboard | Conversations, resolution rate, CSAT, top questions, unanswered questions |
| FR-11 | Multilingual | English + Bangla (auto-detect language) |

### 5.2 Post-MVP (P1/P2)
- Messenger, WhatsApp, Instagram, Telegram channels (P1)
- Shopify / WooCommerce live integrations (P1)
- LMS integrations (Moodle, Google Classroom) (P2)
- Proactive messages / cart-recovery nudges (P2)
- Public API & webhooks (P1)
- White-label / reseller program (P2)
- Voice channel (P2)

## 6. Pricing & Packaging (Proposed)
| Plan | Price/mo | Limits | Highlights |
|---|---|---|---|
| **Free Trial** | $0 (14 days) | 100 conversations | 1 bot, web widget |
| **Starter** | $19 | 1,000 conv., 1 bot, 1 agent seat | Niche pack, branding removable: no |
| **Growth** | $59 | 5,000 conv., 3 bots, 5 seats | Channels, analytics, remove branding |
| **Scale** | $149 | 20,000 conv., 10 bots, 15 seats | API, priority support, SSO-lite |
| **Add-ons** | Usage-based | Extra conversations | Overage per 1,000 conversations |

> Pricing is a hypothesis — validate with 10–15 customer interviews before launch. Support local payment methods (bKash/Nagad/cards) for BD market.

## 7. Non-Functional Requirements
- **Performance:** p95 bot response < 6s; widget load < 1s (async script, < 60 KB gz).
- **Availability:** 99.5% MVP, 99.9% target later.
- **Security:** Tenant data isolation, encryption in transit/at rest, GDPR-style delete/export.
- **Accuracy:** Hallucination rate < 3% on evaluation set; mandatory fallback when no source found.
- **Scalability:** 500 tenants / 50 concurrent chats per tenant without redesign.
- **Accessibility:** WCAG 2.1 AA for dashboard & widget.

## 8. Success Metrics (KPIs)
| Metric | Target (6 months post-launch) |
|---|---|
| Paying tenants | 100 |
| MRR | $4,000+ |
| Trial → Paid conversion | ≥ 12% |
| Bot resolution rate | ≥ 60% |
| CSAT | ≥ 4.2 / 5 |
| Monthly logo churn | ≤ 5% |
| Time-to-first-bot | ≤ 30 min |

## 9. Risks & Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| LLM hallucination | Brand damage | RAG-only answers, citations, confidence threshold, handoff |
| LLM cost spikes | Margin loss | Model routing, caching, per-plan quotas |
| Low differentiation | Churn | Deep niche packs & integrations |
| Data privacy concerns | Lost deals | Tenant isolation, DPA, clear data policy |
| Vendor dependency | Outage | Multi-provider LLM gateway with fallback |

## 10. Release Plan
- **Alpha (internal):** Web widget + RAG on one tenant.
- **Private Beta:** 5–10 pilot customers (e-commerce + education).
- **Public Launch:** Billing, analytics, both niche packs.

## 11. Open Questions
1. Which LLM provider(s) give best cost/quality for Bangla?
2. Per-conversation vs per-message pricing?
3. Which channel after web widget — Messenger or WhatsApp?
4. Do we need data residency options?
