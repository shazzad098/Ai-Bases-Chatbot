# NicheDesk Widget

Embeddable chat widget — vanilla TS, Shadow DOM, no global CSS leak, <60KB gz target.

## Usage

```html
<script async src="https://cdn.nichedesk.com/nichedesk-widget.js"></script>
<nichedesk-widget
  bot-key="pk_live_..."
  api="https://api.nichedesk.com"
  color="#4F46E5"
  position="right"
  niche="ecommerce"
  lang="en"
  greeting="Hi! How can I help?">
</nichedesk-widget>
```

## Attributes

| Attr | Description |
|---|---|
| `bot-key` | Bot public key (required) |
| `api` | API base URL (default `http://localhost:8000`) |
| `color` | Brand accent color |
| `position` | `left` or `right` (default `right`) |
| `niche` | `ecommerce` / `education` / `general` (quick replies) |
| `lang` | `en` / `bn` (auto-detect from browser if omitted) |
| `greeting` | Custom greeting override |
| `bot-name` | Header display name |

## Dev

```bash
npm install
npm run typecheck
npm run build   # -> dist/nichedesk-widget.js
```
