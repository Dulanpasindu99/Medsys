# Medsys Documentation Index

This repository now keeps two primary documentation deliverables:

- Client document:
  - Markdown: `docs/Medsys_Client_Documentation.md`
  - PDF: `docs/Medsys_Client_Documentation.pdf`
- Developer document:
  - Markdown: `docs/Medsys_Developer_Documentation.md`
  - PDF: `docs/Medsys_Developer_Documentation.pdf`
- Frontend client specification:
  - Markdown source: `docs/MEDSYS_Frontend_Client_Specification.md`
  - Styled HTML source: `docs/MEDSYS_Frontend_Client_Specification.html`
  - Final PDF deliverable: `docs/MEDSYS_Frontend_Client_Specification.pdf`
- Roadmap:
  - Markdown: `ROADMAP.md`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test:unit
npm test
```

## Environment

```bash
NEXT_PUBLIC_API_BASE_URL=https://medlinkapi.aldtan.com
NEXT_PUBLIC_ORGANIZATION_SLUG=sunrise-clinic
BACKEND_URL=https://medlinkapi.aldtan.com
API_BASE_URL=https://medlinkapi.aldtan.com
MEDSYS_SESSION_SECRET=replace-with-a-long-random-secret
# Optional during zero-downtime rotation:
# MEDSYS_SESSION_SECRET_PREVIOUS=previous-long-random-secret
# Optional server-only bootstrap override (preferred):
# MEDSYS_BOOTSTRAP_ORGANIZATION_SLUG=sunrise-clinic
# Optional server-only legacy fallback:
# MEDSYS_BOOTSTRAP_ORGANIZATION_ID=11111111-1111-1111-1111-111111111111
```

Use a strong random value for `MEDSYS_SESSION_SECRET` in any shared or production environment. The app rejects placeholder secrets when `NODE_ENV=production`. During secret rotation, keep the new value in `MEDSYS_SESSION_SECRET` and set the old value in `MEDSYS_SESSION_SECRET_PREVIOUS` until existing sessions naturally expire.
