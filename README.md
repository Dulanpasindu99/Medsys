# Medsys Frontend

Next.js (App Router) frontend for a clinic workflow system (owner, doctor, assistant) with a same-origin backend API proxy and signed app sessions.

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
# optional, defaults to the medsys dev org id
NEXT_PUBLIC_ORGANIZATION_ID=11111111-1111-1111-1111-111111111111

# backend origin used by server-side auth + API proxy
BACKEND_URL=http://localhost:4000

# signed app session secret
MEDSYS_SESSION_SECRET=change-me
```

Frontend feature calls go to the internal proxy route `/api/backend/:path*`, which forwards to `BACKEND_URL` server-side and injects backend auth from secure cookies. The browser never receives backend access or refresh tokens directly.

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test
```

`test` runs lint + strict typecheck + unit/component tests.

## Authentication Model

- Login goes through `POST /api/auth/login`, which authenticates against the backend and sets:
  - signed app session cookie
  - secure `httpOnly` backend access-token cookie
  - secure `httpOnly` backend refresh-token cookie
- App identity is read from `GET /api/auth/me`.
- Logout goes through `POST /api/auth/logout`.
- Feature API requests go through `app/api/backend/[...path]/route.ts`.
- On backend `401`, the proxy attempts one server-side refresh with the refresh-token cookie and retries the original request.
- If refresh fails, backend cookies and the app session are cleared together.

## API Scope (frontend mapped)

- Auth:
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/me`
  - `/api/backend/v1/auth/refresh` (server-side only)
- Patients:
  - `/api/backend/v1/patients`
  - `/api/backend/v1/patients/:id/profile`
- Appointments:
  - `/api/backend/v1/appointments`
- Encounters:
  - `/api/backend/v1/encounters`
- Prescriptions:
  - `/api/backend/v1/prescriptions/queue/pending-dispense`
  - `/api/backend/v1/prescriptions/:id/dispense`

## Important Paths

- API client:
  - `app/lib/api-client.ts`
- Backend auth cookies:
  - `app/lib/backend-auth-cookies.ts`
- Backend proxy:
  - `app/api/backend/[...path]/route.ts`
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
