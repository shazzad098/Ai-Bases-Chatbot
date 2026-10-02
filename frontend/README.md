# NicheDesk Frontend

Next.js 14 App Router + TypeScript strict + Tailwind. Admin dashboard for NicheDesk SaaS.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3000
```

Backend base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/v1`). All API calls use `lib/api.ts` with mock fallback data so UI works with backend down.

## Pages

- `/` Overview (KPIs, setup checklist, top unanswered)
- `/bots` Bot setup tabs · `/knowledge` sources table + Add-source modal · `/appearance` theme + live preview
- `/install` snippet + verify · `/inbox` 3-pane · `/leads` table · `/analytics` placeholders
- `/playground` split chat + sources/confidence · `/billing` plans + usage meter

## i18n

`lib/i18n.ts` — `en`/`bn` dict, `t(lang, key)`. No hardcoded customer-facing strings; toggle in sidebar.
