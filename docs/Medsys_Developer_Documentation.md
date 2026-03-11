# Medsys Developer Documentation

Architecture, Implementation, and Delivery Status

Version: 1.0
Date: March 11, 2026
Document Status: Developer Reference
System Version: Frontend `0.1.0`
Audience: Frontend developers, backend developers, QA, technical leads, solution architects

## 1. Purpose

This document is the developer-facing reference for the Medsys frontend repository. It consolidates implementation details, architecture decisions, current code organization, backend integration behavior, delivered phases, open gaps, and the remaining work tracks.

It is intended to replace the earlier split across roadmap, requirements, contract, and closure documents.

## 2. Application Summary

Medsys is a Next.js App Router application for clinic operations. It supports:

- authentication and role-based shell access
- doctor consultation workflows
- assistant intake and dispensing workflows
- patient directory and patient profile flows
- owner staff-management visibility
- appointments, encounters, prescriptions, and inventory workflows
- analytics and AI-assisted operational summaries

The frontend is implemented as a browser client plus a same-origin BFF layer. Browser code calls `/api/...` routes. Those routes validate or normalize payloads as needed and forward server-side to backend `/v1/...` routes using secure backend auth cookies.

## 3. Stack

## 3.1 Runtime Stack

- Next.js `16.0.1`
- React `19.2.0`
- TypeScript `5`
- Tailwind CSS `4`
- TanStack Query `5.90.21`

## 3.2 Quality Tooling

- ESLint `9`
- Vitest `4.0.18`
- Testing Library
- TypeScript strict checking

## 3.3 Current NPM Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm test`

## 4. Architecture Overview

## 4.1 High-Level Architecture

1. Browser UI calls frontend `/api/...` routes.
2. Frontend BFF routes validate and normalize browser-facing contracts.
3. BFF routes forward to backend `/v1/...` services using server-side credentials.
4. Signed app session and backend auth cookies maintain authenticated access.
5. Shared authorization rules drive route access, navigation visibility, and selected action affordances.

## 4.2 Auth Model

Current auth/session architecture:

- login goes through `POST /api/auth/login`
- app identity goes through `GET /api/auth/me`
- auth bootstrap state goes through `GET /api/auth/status`
- logout goes through `POST /api/auth/logout`
- backend access and refresh tokens are stored in secure `httpOnly` cookies
- app session is stored in a signed session cookie
- backend token refresh is handled server-side in the proxy/BFF layer

## 4.3 BFF Model

Current browser-facing routes are backend-backed through dedicated BFF routes or the generic authenticated proxy:

- auth
- patients
- patient history
- patient-profile support feeds
- families
- users
- appointments
- encounters
- prescriptions and dispense
- inventory
- analytics overview
- audit logs
- ICD-10

## 5. Repository Layout

## 5.1 Key Top-Level Paths

- `app`
- `public`
- `scripts`
- `tmp`
- `docs`

## 5.2 Frontend App Structure

Important application paths:

- `app/layout.tsx`
- `app/login`
- `app/(shell)`
- `app/api`
- `app/components`
- `app/hooks`
- `app/lib`
- `app/sections`
- `app/utils`

## 5.3 Important Library Files

- `app/lib/api-client.ts`
  - browser-facing API access layer
- `app/lib/query-hooks.ts`
  - shared TanStack Query hooks
- `app/lib/query-keys.ts`
  - shared query keys
- `app/lib/api-auth.ts`
  - frontend route auth helpers
- `app/lib/authorization.ts`
  - shared permission model
- `app/lib/api-validation.ts`
  - request validation helpers
- `app/lib/api-serializers.ts`
  - response normalization helpers
- `app/lib/backend-route-client.ts`
  - server-side backend forwarding helper
- `app/lib/backend-auth-cookies.ts`
  - backend token cookie handling
- `app/lib/session.ts`
  - signed app session handling
- `app/lib/backend-contract-adapters.ts`
  - remaining server-side compatibility normalization

## 5.4 Feature Sections

- `app/sections/AssistantSection.tsx`
- `app/sections/DoctorSection.tsx`
- `app/sections/OwnerSection.tsx`
- `app/sections/PatientSection.tsx`
- `app/sections/AnalyticsSection.tsx`
- `app/sections/AiSection.tsx`
- `app/sections/InventorySection.tsx`
- `app/sections/patient-profile`

## 6. Current Implementation Status

## 6.1 Implemented Foundation

Implemented and active:

- backend-driven auth and session model
- shared permission matrix
- backend-backed BFF route structure
- prototype store retirement
- BE-020 frontend closure
- shared query layer rollout across the major read-heavy screens
- owner workflow hardening to backend-backed user list/create
- analytics, AI, and patient-profile stable read contract cleanup

## 6.2 Frontend Delivery Status By Track

### Track A: Shared Query Layer

Status: `Implemented for current core reads`

Implemented:

- auth current-user and auth status
- patient directory
- doctor queue and patient details
- assistant operational reads
- owner operational reads
- analytics snapshot
- AI insight feeds
- patient-profile feeds
- inventory board reads

Remaining:

- write-heavy mutation invalidation polish
- future adoption for new read-heavy features

### Track B: Adapter And Contract Cleanup

Status: `In Progress`

Implemented:

- browser auth/register flows now consume normalized `/api/...` responses directly
- stable read-feed guards now live in `app/lib/api-client.ts`
- analytics, AI, and patient-profile hooks no longer carry broad mixed-shape parsing for their stabilized feeds

Remaining:

- trim `app/lib/backend-contract-adapters.ts` further as backend drift disappears
- keep compatibility normalization server-side only

### Track C: Permission And UX Alignment

Status: `In Progress`

Implemented:

- appointment-create policy aligned to current backend behavior
- owner and assistant allowed
- doctor denied

Remaining:

- continue reviewing action-level UI affordances against live backend policy

### Track D: Workflow Hardening

Status: `In Progress`

Implemented:

- owner staff management now uses backend users API
- assistant and doctor workflows use backend-backed production paths
- analytics and AI use shared query-backed reads

Remaining:

- mutation feedback consistency in write-heavy workflows
- invalidation consistency after writes
- additional UX polish where business rules may still evolve

### Track E: Artifact Retirement

Status: `Implemented`

Implemented:

- `app/lib/store.ts` removed
- BE-020 closure documented
- stale prototype live-path references removed from active code

## 7. Backend Alignment Status

## 7.1 Current Frontend Position

From the frontend perspective:

- browser production-path calls are on `/api/...`
- BFF routes forward to backend `/v1/...`
- ICD-10 is backend-aligned
- active prototype persistence is retired
- frontend BE-020 is closed

## 7.2 Current Backend Alignment Snapshot

Backend alignment is strongest for:

- auth login
- auth refresh
- auth me
- auth status
- patients
- patient history
- users
- appointments
- encounters
- prescriptions and dispensing
- inventory
- analytics overview
- audit logs
- ICD-10

Backend alignment areas still treated as ongoing:

- full permission-name alignment on the backend
- full validation-envelope consistency across all backend endpoints
- further reduction of server-side compatibility adapters as backend contracts stabilize

## 8. Browser-Facing BFF Coverage

Current primary browser-facing BFF route families:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/status`
- `/api/auth/register`
- `/api/patients`
- `/api/patients/:id`
- `/api/patients/:id/history`
- `/api/patients/:id/profile`
- `/api/patients/:id/family`
- `/api/patients/:id/vitals`
- `/api/patients/:id/allergies`
- `/api/patients/:id/conditions`
- `/api/patients/:id/timeline`
- `/api/users`
- `/api/families`
- `/api/appointments`
- `/api/encounters`
- `/api/prescriptions/queue/pending-dispense`
- `/api/prescriptions/:id`
- `/api/prescriptions/:id/dispense`
- `/api/inventory`
- `/api/inventory/:id`
- `/api/inventory/:id/movements`
- `/api/analytics/overview`
- `/api/audit/logs`
- `/api/clinical/icd10`

## 9. Testing Status

Current quality gate:

- `npm test`
  - lint
  - typecheck
  - unit/component/route tests

Current implemented verification baseline:

- 30 passing test files
- 115 passing tests

Current note:

- `baseline-browser-mapping` is stale and still emits a non-blocking warning during the test run

## 10. Implemented Functional Areas

Implemented in active frontend scope:

- login, logout, auth status, current-user resolution
- role-based shell access
- doctor encounter workflow
- assistant intake and dispense workflow
- patient directory and profile
- owner staff list/create via backend users API
- appointment list and creation
- encounter list and submission
- prescription queue, detail, and dispense
- inventory list, item creation, update, and movements
- analytics overview
- AI insight summary view
- audit log visibility
- backend-backed ICD-10 suggestions

## 11. Not Yet Implemented Or Not Fully Mature

Not fully implemented or not yet enterprise-complete:

- patient self-service portal
- billing and claims
- laboratory and imaging integrations
- deep compliance controls and governance workflows
- advanced audit governance tooling
- full backend permission-name parity across every domain action
- full elimination of server-side compatibility adapters
- final enterprise-grade mutation UX polish everywhere

## 12. Developer Workflow Guidance

When extending this codebase:

- keep browser code on `/api/...` only
- keep backend quirks inside BFF or server-side normalization layers
- prefer shared query hooks for remote reads
- use explicit loading, empty, error, and retry states
- align action affordances with backend permissions before exposing UI actions
- avoid reintroducing broad `unknown` response parsing in feature hooks for stabilized BFF routes

## 13. Current Priorities

Immediate next priorities:

1. tighten mutation feedback and invalidation in write-heavy screens
2. continue action-level permission affordance review
3. trim remaining server-side contract-adapter debt as backend stabilizes

## 14. Environment And Runtime Notes

Expected important environment values:

- `BACKEND_URL`
- `MEDSYS_SESSION_SECRET`
- optional `NEXT_PUBLIC_ORGANIZATION_ID`

Current behavior:

- frontend requires backend availability for protected shell rendering
- same-origin BFF routes act as the application trust boundary

## 15. Conclusion

The Medsys frontend now has a stable production-oriented architecture: backend-backed BFF routes, secure session handling, shared authorization, shared query infrastructure, and retired prototype persistence. The remaining work is no longer migration or emergency stabilization. It is cleanup, workflow hardening, and backend-alignment refinement.
