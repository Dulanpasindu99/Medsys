# Medsys Frontend

Next.js (App Router) frontend for a clinic workflow system (owner, doctor, assistant) with iOS-style UI and server-side session authentication.

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

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test
```

`test` currently runs lint + strict typecheck as the baseline CI gate.

## Authentication Model

- Session cookie: `medsys_session` (httpOnly, sameSite=lax, secure in production)
- Login endpoint: `POST /api/auth/login`
- Logout endpoint: `POST /api/auth/logout`
- Current session: `GET /api/auth/me`
- Bootstrap status: `GET /api/auth/status`

First-time setup:
- If there are no users, the first owner is created through `POST /api/auth/register` with role `owner`.
- Login page supports this bootstrap flow automatically.

## Authorization Rules

- `owner` only:
  - `GET/POST /api/users`
  - `DELETE /api/patients/[id]`
  - `/owner` page
- authenticated (`owner|doctor|assistant`):
  - patient list/details/history APIs
  - `/patient`, `/analytics`, `/inventory`, `/ai`
- authenticated (`owner|doctor`):
  - `/` doctor workspace
- authenticated (`owner|assistant`):
  - `/assistant`

## Important Paths

- API auth and guards:
  - `app/lib/session.ts`
  - `app/lib/api-auth.ts`
  - `app/lib/page-auth.ts`
- API client:
  - `app/lib/api-client.ts`
- Validation:
  - `app/utils/schema-validation/doctor-section.schema.ts`
- Feature sections:
  - `app/sections/DoctorSection.tsx`
  - `app/sections/AssistantSection.tsx`
  - `app/sections/OwnerSection.tsx`
  - `app/sections/PatientSection.tsx`

## Notes

- ICD-10 suggestion requests are proxied through `GET /api/clinical/icd10` (server-side), not called directly from browser to third-party.
- One lint warning remains in `DoctorSection` for `<img>` usage (`next/image` recommendation).
