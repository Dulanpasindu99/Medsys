# Medsys UI

Frontend Product README

This document explains the Medsys user interface as a product-facing frontend application. It is intended to be easier to hand to frontend, product, QA, and stakeholder audiences than the current technical `README.md`.

## 1. What This UI Is

Medsys is a role-based clinic operations frontend built with Next.js App Router. The UI is designed for internal healthcare operations, not a patient self-service portal.

The current frontend supports:

- doctor workflow for queue review and encounter capture
- assistant workflow for intake and dispensing
- patient directory and patient profile viewing
- analytics dashboard
- AI insights workspace
- inventory management workspace
- owner workspace for staff visibility and access review
- protected navigation, session-aware routing, and full-screen error or outage states

## 2. User Roles

The current UI supports these authenticated roles:

- `doctor`
- `assistant`
- `owner`

Role and permission rules are used for:

- shell route access
- navigation visibility
- internal API route protection in the frontend BFF layer

Key policy files:

- `app/lib/authorization.ts`
- `app/lib/page-auth.ts`
- `app/lib/api-auth.ts`

## 3. Main Routes

### Public route

- `/login`

### Protected shell routes

- `/` -> Doctor workspace
- `/assistant` -> Assistant workspace
- `/patient` -> Patient directory
- `/analytics` -> Analytics dashboard
- `/inventory` -> Inventory board
- `/ai` -> AI insights workspace
- `/owner` -> Owner workspace

### Full-screen system routes

- `/system/unavailable`
- route-level error page: `app/error.tsx`
- global error page: `app/global-error.tsx`

## 4. UI Modules

### 4.1 Doctor Workspace

Primary purpose:

- review the waiting queue
- select a patient
- inspect vitals and allergies
- capture an encounter
- record diagnoses, tests, prescription items, and next-visit information

Main files:

- `app/(shell)/page.tsx`
- `app/sections/DoctorSection.tsx`
- `app/sections/doctor/hooks/useDoctorWorkspaceData.ts`

Current behavior:

- loads waiting appointments and patient records
- allows patient search by name or NIC
- opens patient profile from the doctor flow
- saves encounter data through `/api/encounters`

### 4.2 Assistant Workspace

Primary purpose:

- register new patient intake
- review pending dispense queue
- inspect prescription details
- complete dispense actions

Main files:

- `app/(shell)/assistant/page.tsx`
- `app/sections/AssistantSection.tsx`
- `app/sections/assistant/hooks/useAssistantWorkflow.ts`

Current behavior:

- intake form supports patient details used by the current UI
- dispense queue is loaded through dedicated prescription BFF routes
- dispense actions refresh queue state after completion

### 4.3 Patient Directory

Primary purpose:

- search and filter patient records
- review patient summary cards
- open the patient profile popup/view

Main files:

- `app/(shell)/patient/page.tsx`
- `app/sections/PatientSection.tsx`
- `app/sections/patient/hooks/usePatientDirectory.ts`

Current behavior:

- patient list is backend-backed
- family, appointment, condition, allergy, and timeline data are merged into directory summaries
- filtering supports family, age, gender, and search terms

### 4.4 Patient Profile

Primary purpose:

- show a patient summary with profile, family, allergies, conditions, vitals-derived timeline, and first-seen information

Main files:

- `app/sections/patient-profile/PatientProfileView.tsx`
- `app/sections/patient-profile/hooks/usePatientProfileData.ts`
- `app/hooks/usePatientProfilePopup.ts`

Current behavior:

- profile support feeds are now loaded through dedicated frontend BFF routes
- partial-data warnings appear when support feeds fail independently
- retry behavior is available for failed profile loads

### 4.5 Analytics Dashboard

Primary purpose:

- show operational summary metrics across patients, appointments, encounters, and inventory

Main files:

- `app/(shell)/analytics/page.tsx`
- `app/sections/AnalyticsSection.tsx`
- `app/sections/analytics/hooks/useAnalyticsSnapshot.ts`

Current behavior:

- analytics overview uses `/api/analytics/overview`
- dashboard combines overview data with operational feeds
- explicit loading, empty, retry, error, and partial-data warning states are present

### 4.6 Inventory Workspace

Primary purpose:

- review inventory items
- create items
- adjust stock through movements
- inspect movement history

Main files:

- `app/(shell)/inventory/page.tsx`
- `app/sections/InventorySection.tsx`
- `app/sections/inventory/hooks/useInventoryBoard.ts`

Current behavior:

- list, create, update, and movement flows use dedicated `/api/inventory...` BFF routes
- inventory state handling supports explicit pending and retry flows

### 4.7 AI Insights Workspace

Primary purpose:

- display derived operational insight summaries from analytics, patient, appointment, and audit-log data

Main files:

- `app/(shell)/ai/page.tsx`
- `app/sections/AiSection.tsx`
- `app/sections/ai/hooks/useAiInsightsData.ts`

Current behavior:

- loads analytics overview, patients, appointments, and audit logs
- now uses dedicated BFF-backed audit-log access instead of direct backend browser calls
- surfaces explicit partial-feed warnings

### 4.8 Owner Workspace

Primary purpose:

- inspect current staff visibility and operational access context
- view permission presets
- model staff creation inputs in the UI

Main files:

- `app/(shell)/owner/page.tsx`
- `app/sections/OwnerSection.tsx`
- `app/sections/owner/hooks/useOwnerAccess.ts`

Current behavior:

- owner-only route
- combines audit-log and appointment-derived context
- still includes local draft creation behavior for staff entries in the UI
- this is one of the remaining frontend areas that still needs deeper backend-backed operational hardening

## 5. Navigation And Shell

The shell layout lives in:

- `app/(shell)/layout.tsx`
- `app/components/NavigationPanel.tsx`

Current shell characteristics:

- protected before main UI render
- role-aware navigation visibility
- active-route highlighting
- logout action
- hydration-safe navigation rendering

## 6. Authentication And Session Model

The UI does not keep backend access tokens in browser storage.

Current model:

- login goes through `POST /api/auth/login`
- backend access and refresh tokens are stored in secure `httpOnly` cookies
- the app also stores a signed frontend session cookie
- current user identity is read from `GET /api/auth/me`
- logout goes through `POST /api/auth/logout`
- protected routes are blocked before shell render when session is missing or invalid

Main auth files:

- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/me/route.ts`
- `app/api/auth/status/route.ts`
- `app/lib/session.ts`
- `app/lib/backend-auth-cookies.ts`

## 7. Frontend API Architecture

The browser is intended to talk to stable same-origin frontend routes under `/api/...`.

There are two frontend integration layers:

- dedicated BFF routes for stabilized domains
- generic authenticated backend proxy for remaining backend surface area

### Dedicated BFF routes already in place

- auth:
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/me`
  - `/api/auth/status`
  - `/api/auth/register`
- patients:
  - `/api/patients`
  - `/api/patients/:id`
  - `/api/patients/:id/history`
  - `/api/patients/:id/profile`
  - `/api/patients/:id/family`
  - `/api/patients/:id/vitals`
  - `/api/patients/:id/allergies`
  - `/api/patients/:id/conditions`
  - `/api/patients/:id/timeline`
- families:
  - `/api/families`
- users:
  - `/api/users`
- appointments:
  - `/api/appointments`
- encounters:
  - `/api/encounters`
- analytics:
  - `/api/analytics/overview`
- audit logs:
  - `/api/audit/logs`
- prescriptions:
  - `/api/prescriptions/queue/pending-dispense`
  - `/api/prescriptions/:id`
  - `/api/prescriptions/:id/dispense`
- inventory:
  - `/api/inventory`
  - `/api/inventory/:id`
  - `/api/inventory/:id/movements`
- terminology:
  - `/api/clinical/icd10`

### Generic proxy

- `/api/backend/:path*`

Used for:

- remaining backend endpoints not yet promoted to dedicated BFF routes
- server-side token injection and refresh retry

Main integration files:

- `app/lib/api-client.ts`
- `app/lib/backend-route-client.ts`
- `app/api/backend/[...path]/route.ts`

## 8. Async UX Model

The UI now uses explicit async states across major modules:

- loading
- ready
- empty
- error
- mutation pending
- mutation success
- mutation error

Shared files:

- `app/lib/async-state.ts`
- `app/components/ui/AsyncStatePanel.tsx`

This means the UI now intentionally surfaces:

- retry actions
- disabled controls during pending mutations
- partial-data warnings when non-critical feeds fail

## 9. Error And Outage Handling

Current behavior:

- backend availability can trigger a full-screen unavailable route
- route-level recoverable failures use a full-screen app error UI
- unrecoverable failures use a global full-screen error UI
- these states do not render the normal shell UI behind them

Main files:

- `app/system/unavailable/page.tsx`
- `app/error.tsx`
- `app/global-error.tsx`

## 10. Current UI Completion Status

The frontend is now past prototype stage and is operating on a production-leaning BFF architecture.

What is complete or materially complete:

- protected shell and role-based navigation
- secure session and backend-cookie auth bridge
- explicit async state handling across main screens
- dedicated BFF routes for all major production-path UI domains
- patient profile support feed migration
- encounter submit migration
- final audit of prototype-era browser-side `/v1/...` calls

What still needs the next phase of work:

- shared server-state/query architecture
- trimming compatibility adapters route by route as backend contracts stabilize
- deeper owner workspace hardening beyond local draft modeling
- continued reduction of broad `unknown` parsing in feature hooks

## 11. Quality And Verification

Current quality commands:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm test
```

At the current documented state:

- frontend unit/component/route/client tests are passing
- the frontend BFF migration slices for analytics, patient-profile support feeds, encounter submit, families, and audit logs are complete

## 12. Important Frontend Files

- shell:
  - `app/(shell)/layout.tsx`
  - `app/components/NavigationPanel.tsx`
- auth and session:
  - `app/lib/session.ts`
  - `app/lib/backend-auth-cookies.ts`
  - `app/lib/api-auth.ts`
- browser API layer:
  - `app/lib/api-client.ts`
- BFF route transport:
  - `app/lib/backend-route-client.ts`
- validation and serialization:
  - `app/lib/api-validation.ts`
  - `app/lib/api-serializers.ts`
- compatibility layer:
  - `app/lib/backend-contract-adapters.ts`
- main sections:
  - `app/sections/DoctorSection.tsx`
  - `app/sections/AssistantSection.tsx`
  - `app/sections/PatientSection.tsx`
  - `app/sections/AnalyticsSection.tsx`
  - `app/sections/InventorySection.tsx`
  - `app/sections/AiSection.tsx`
  - `app/sections/OwnerSection.tsx`

## 13. Suggested Use

Use this file when you need:

- a frontend-oriented product README
- a UI handoff summary
- a simpler main repository README for the frontend

Keep the existing `README.md` as the technical integration README unless you explicitly want to replace it with this one.
