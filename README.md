# Medsys Frontend

Next.js (App Router) frontend for a clinic workflow system (owner, doctor, assistant) with backend-token authentication aligned to `@medsys/api`.

## Stack

- Next.js 16
- React 19
- TypeScript (strict)
- Tailwind CSS 4

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Backend Integration (Current)

Set these env values in frontend runtime:

```bash
# frontend -> backend API base
# default in code is /backend (recommended for local dev via Next rewrites)
NEXT_PUBLIC_API_BASE_URL=/backend

# optional, defaults to the medsys dev org id
NEXT_PUBLIC_ORGANIZATION_ID=11111111-1111-1111-1111-111111111111

# server-side rewrite target for /backend/*
BACKEND_URL=http://localhost:4000
```

Rewrites are configured in `next.config.ts`:
- `/backend/:path*` -> `${BACKEND_URL}/:path*`

This avoids CORS issues during local development when backend CORS is not enabled.

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test
```

`test` runs lint + strict typecheck + unit/component tests.

## Authentication Model

- Access token + refresh token are stored client-side (`localStorage`).
- Login endpoint: `POST /v1/auth/login`
- Refresh endpoint: `POST /v1/auth/refresh`
- API client auto-attaches:
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`
  - `x-request-id: <uuid>`
- On `401`, client automatically attempts one refresh and retries.

Primary auth client:
- `app/lib/api-client.ts`

## API Scope (frontend mapped)

- Auth:
  - `/v1/auth/login`
  - `/v1/auth/refresh`
- Patients:
  - `/v1/patients`
  - `/v1/patients/:id/profile`
- Appointments:
  - `/v1/appointments`
- Encounters:
  - `/v1/encounters`
- Prescriptions:
  - `/v1/prescriptions/queue/pending-dispense`
  - `/v1/prescriptions/:id/dispense`

## Important Paths

- API client:
  - `app/lib/api-client.ts`
- Navigation/logout:
  - `app/components/NavigationPanel.tsx`
- Login flow:
  - `app/login/page.tsx`
- Validation:
  - `app/utils/schema-validation/doctor-section.schema.ts`
- Feature sections:
  - `app/sections/DoctorSection.tsx`
  - `app/sections/AssistantSection.tsx`
  - `app/sections/OwnerSection.tsx`
  - `app/sections/PatientSection.tsx`

## Notes

- ICD-10 suggestion requests are proxied through `GET /api/clinical/icd10` (server-side), not called directly from browser to third-party.
- `npm run test` currently runs lint + typecheck as baseline quality gate.
