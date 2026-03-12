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
NEXT_PUBLIC_ORGANIZATION_ID=11111111-1111-1111-1111-111111111111
BACKEND_URL=http://localhost:4000
MEDSYS_SESSION_SECRET=change-me
```
