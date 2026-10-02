# Design Specification (UX/UI)

**Product:** NicheDesk | **Version:** 0.1
Covers: (1) Admin Dashboard, (2) Chat Widget, (3) Design System.

---

## 1. Design Principles
1. **Simple first** — a non-technical shop owner should get a working bot in 30 minutes.
2. **Trustworthy** — show sources, be honest about uncertainty, make human help easy.
3. **Fast** — instant feedback, streaming answers, skeleton loaders.
4. **Niche-aware** — language, examples and defaults adapt to E-commerce / Education.
5. **Inclusive** — Bangla + English, accessible, mobile-first.

## 2. Information Architecture
```
Dashboard
├── Overview (KPIs, alerts, setup progress)
├── Bots
│   ├── Setup (niche, persona, greeting)
│   ├── Knowledge (sources, status, test search)
│   ├── Appearance (widget theme, preview)
│   ├── Channels (web, Messenger, WhatsApp...)
│   └── Install (script snippet, domain allowlist)
├── Inbox (conversations, filters, assignment)
├── Leads
├── Analytics (resolution, CSAT, top/unanswered questions)
├── Playground (test the bot, see retrieved sources)
├── Team (members, roles)
├── Billing (plan, usage, invoices)
└── Settings (profile, API keys, data/privacy)
```

## 3. Key User Flows
**Onboarding (target ≤ 30 min)**
`Sign up → Choose niche (E-commerce / Education) → Add knowledge (upload / URL / paste) → Preview in Playground → Customize widget → Copy install snippet → Go live`
- Persistent setup checklist with progress bar on Overview.
- Niche-specific starter content (sample FAQ, sample policy templates).

**Customer chat**
`Open widget → Greeting + quick replies → Ask → Streaming answer with sources → Feedback 👍/👎 → (Optional) Talk to human / leave contact`

**Handoff**
`Bot detects trigger → Notify agents → Agent sees full transcript + AI summary → Replies in Inbox → Resolves → Bot resumes`

## 4. Key Screens (Wireframe Notes)
| Screen | Layout & Content |
|---|---|
| **Overview** | KPI cards (Conversations, Resolution %, CSAT, Leads), trend chart, setup checklist, "Top unanswered questions" |
| **Knowledge** | Table of sources (type, status chip: Processing / Ready / Failed, last synced), "Add source" modal with tabs (Upload, URL, Text), re-index button |
| **Playground** | Split view: chat on left, "Retrieved sources + confidence" panel on right |
| **Appearance** | Left: color/logo/position/greeting controls; Right: live widget preview (desktop + mobile toggle) |
| **Inbox** | 3-pane: conversation list • transcript • customer/context panel (tags, notes, lead data) |
| **Analytics** | Date filter, funnel (asked → answered → resolved → handed off), CSAT trend, topic clusters |
| **Billing** | Current plan card, usage meter, plan comparison, invoices table |

## 5. Chat Widget Spec
- **Launcher:** 56px circular button, bottom-right (configurable left), optional teaser bubble.
- **Window:** 380×600 desktop; full-screen sheet on mobile.
- **Header:** bot name, avatar, status ("Typically replies instantly"), minimize/close.
- **Messages:** user (brand color bubble), bot (neutral bubble), source chips under bot messages, timestamp on hover.
- **Input:** auto-grow textarea, send button, optional attachment (P1).
- **Quick replies:** niche-specific (e.g., "Track my order", "Return policy" / "Admission info", "Course fees").
- **Always visible:** "Talk to a human" link and AI disclosure text.
- **States:** loading (typing dots), error with retry, offline (leave message form), rate-limited.
- **Tech constraints:** Shadow DOM, < 60 KB gz, no global CSS leakage, respects `prefers-reduced-motion`.

## 6. Design System
### 6.1 Color Tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| `--primary` | #4F46E5 | #818CF8 | Primary actions, links |
| `--primary-fg` | #FFFFFF | #0B0B14 | Text on primary |
| `--bg` | #FFFFFF | #0F1117 | App background |
| `--surface` | #F8FAFC | #171A23 | Cards, panels |
| `--border` | #E2E8F0 | #2A2F3C | Dividers |
| `--text` | #0F172A | #E5E7EB | Body text |
| `--muted` | #64748B | #9CA3AF | Secondary text |
| `--success` | #16A34A | #4ADE80 | Ready, resolved |
| `--warning` | #D97706 | #FBBF24 | Processing, limits |
| `--danger` | #DC2626 | #F87171 | Errors, destructive |
Widget accent color is tenant-configurable; system enforces WCAG AA contrast (auto-pick text color).

### 6.2 Typography
- **UI:** Inter (Latin) + **Hind Siliguri / Noto Sans Bengali** (Bangla) with proper fallback stack.
- Scale: 12 / 14 / 16 / 20 / 24 / 32 px; line-height 1.5 (1.7 for Bangla body text).
- Weights: 400 regular, 500 medium, 600 semibold.

### 6.3 Spacing, Radius, Elevation
- 4px base grid (4, 8, 12, 16, 24, 32, 48).
- Radius: 8px controls, 12px cards, 16px widget window.
- Shadows: subtle (`0 1px 2px`), raised (`0 8px 24px rgba(0,0,0,.12)`) for widget.

### 6.4 Core Components
Button (primary/secondary/ghost/danger), Input, Select, Textarea, Switch, Tabs, Modal, Drawer, Toast, Table, Badge/Status chip, Card, Stepper, Empty state, Skeleton, Tooltip, Dropdown, Chat bubble, Source chip, Usage meter.

## 7. Content & Voice
- Friendly, clear, short sentences; avoid jargon (say "knowledge" not "vector index").
- Default greetings per niche:
  - E-commerce: "Hi! 👋 Need help with an order, product or delivery?"
  - Education: "Hello! Ask me about admissions, courses, fees or schedules."
- Honest fallback: "I'm not sure about that. Would you like me to connect you with our team?"
- Provide Bangla and English copy for all customer-facing strings (i18n keys, no hardcoded text).

## 8. Accessibility & Responsiveness
- Contrast ≥ 4.5:1; focus rings visible; full keyboard navigation; ARIA live region for new bot messages.
- Touch targets ≥ 44px; breakpoints: 360, 768, 1024, 1280.
- Dashboard is responsive; Inbox is usable on tablet/mobile.

## 9. Empty, Loading & Error States
- Every list has an empty state with a clear CTA ("Add your first knowledge source").
- Skeleton loaders over spinners for page content.
- Errors state what happened, why (if known), and what to do next; include request ID for support.

## 10. Design Deliverables Checklist
- [ ] Figma file with tokens and component library
- [ ] Wireframes for all Section 4 screens
- [ ] High-fidelity: Onboarding, Knowledge, Playground, Inbox, Widget
- [ ] Clickable prototype for user testing
- [ ] Dark mode variants
- [ ] Bangla typography QA
