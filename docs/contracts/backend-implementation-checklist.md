# Medsys Backend Implementation Checklist

Contract Alignment Tracker

Version: 1.0
Date: March 9, 2026
Audience: Backend and integration teams
Status: Working implementation checklist

## 1. Purpose

This checklist converts the current frontend-side contract in `docs/contracts/internal-api-contract-current.md` into an execution tracker for the backend team. It is intended to help the backend team mark what is implemented, what is blocked, and what still needs alignment before the frontend can rely on backend services instead of prototype internal routes.

## 2. How To Use This Checklist

For each route or capability:

- mark status as `Not Started`, `In Progress`, `Implemented`, `Blocked`, or `Verified`
- keep backend endpoint behavior aligned with `docs/contracts/internal-api-contract-current.md`
- update blockers explicitly instead of working around them in frontend code
- do not mark an item `Verified` until payload validation, authorization, and response shape all match the contract

Suggested owners:

- backend engineering
- platform/security engineering
- terminology/data integration owner

## 3. Status Legend

- `Not Started`: no backend implementation yet
- `In Progress`: implementation exists but is incomplete or unstable
- `Implemented`: endpoint exists and roughly works, but has not completed contract verification
- `Blocked`: cannot complete due to missing dependency, data source, or architectural decision
- `Verified`: endpoint and behavior are aligned with the documented contract and tested

## 4. Priority Order

Recommended backend delivery order:

1. Authentication login and refresh
2. Session identity and logout
3. Patient list and patient create
4. Patient detail and patient update
5. Patient history read and write
6. User list and user create
7. Auth register/bootstrap flow
8. ICD-10 lookup endpoint

## 5. Checklist

## 5.1 Authentication And Session

### BE-001 `POST /v1/auth/login`

- Status: `Implemented`
- Priority: `P0`
- Contract source: `4.1 POST /api/auth/login`
- Required outcomes:
  - accept validated login payload from frontend app layer
  - authenticate against backend user store
  - return JSON object with `accessToken`, `refreshToken`, and optional `expiresIn`
  - ensure token claims support `userId`, `role`, `email`, `name`, and expiry handling expected by frontend
- Dependencies:
  - backend auth service
  - user store
  - token issuer
- Acceptance checklist:
  - request validation matches expected contract
  - invalid credentials produce correct error response
  - success response includes non-empty access and refresh tokens
  - returned token claims can be parsed by the frontend session layer
- Blockers:
  - access-token claims do not currently include `email` or `name`; current claims appear to expose only `sub`, `role`, and `organizationId`

### BE-002 `POST /v1/auth/refresh`

- Status: `Implemented`
- Priority: `P0`
- Contract source: `4.5 /api/backend/:path*`
- Required outcomes:
  - accept refresh token payload from frontend proxy
  - validate refresh token
  - issue replacement access and refresh tokens
  - return JSON object with `accessToken`, `refreshToken`, and optional `expiresIn`
- Dependencies:
  - backend auth service
  - token rotation policy
- Acceptance checklist:
  - invalid refresh token returns unauthorized response
  - successful refresh returns valid token-pair payload
  - refreshed tokens support frontend session rotation without shape changes
- Blockers:
  - none currently documented

### BE-003 `POST /v1/auth/logout`

- Status: `Not Started`
- Priority: `P1`
- Contract source: frontend proxy/session flow
- Required outcomes:
  - support token invalidation or session revocation if backend logout is required
  - define whether logout is stateless or revocation-based
- Dependencies:
  - session revocation strategy decision
- Acceptance checklist:
  - backend and frontend logout expectations are aligned
- Blockers:
  - backend logout strategy decision may be needed

### BE-004 `GET /v1/auth/me` or equivalent identity resolution support

- Status: `Implemented`
- Priority: `P1`
- Contract source: frontend `GET /api/auth/me` depends on session claims today
- Required outcomes:
  - confirm whether backend identity endpoint is needed or whether token claims remain the source
  - if implemented, return stable user identity shape
- Dependencies:
  - auth/session architecture decision
- Acceptance checklist:
  - frontend identity behavior remains stable
- Blockers:
  - current response includes `organizationId`, which is not part of the frontend contract, so this is not yet `Verified`

## 5.2 Patient Domain

### BE-005 `GET /v1/patients`

- Status: `In Progress`
- Priority: `P0`
- Contract source: `4.6 GET /api/patients`
- Required outcomes:
  - return patient list with fields:
    - `id`
    - `name`
    - `date_of_birth`
    - `phone`
    - `address`
    - `created_at`
- Dependencies:
  - patient persistence
  - permission enforcement for `patient.read`
- Acceptance checklist:
  - response shape matches contract exactly
  - authorization is enforced server-side
  - empty list behavior is defined and stable
- Blockers:
  - current backend route returns raw patient rows, not `{ patients: [...] }` with normalized `name`, `date_of_birth`, and `created_at`

### BE-006 `POST /v1/patients`

- Status: `In Progress`
- Priority: `P0`
- Contract source: `4.7 POST /api/patients`
- Required outcomes:
  - accept patient create payload
  - validate:
    - `name`
    - optional `dateOfBirth`
    - optional `phone`
    - optional `address`
  - reject unknown fields
  - return normalized patient object
- Dependencies:
  - patient persistence
  - validation layer
  - permission enforcement for `patient.write`
- Acceptance checklist:
  - validation and unknown-field behavior match contract
  - stored patient data round-trips correctly
  - success payload matches frontend expectation
- Blockers:
  - current backend request contract expects `firstName`, `lastName`, and `gender`, not the frontend contract of `name` plus optional `dateOfBirth`, `phone`, and `address`

### BE-007 `GET /v1/patients/:id`

- Status: `In Progress`
- Priority: `P0`
- Contract source: `4.8 GET /api/patients/:id`
- Required outcomes:
  - validate positive integer patient id
  - return patient object and embedded history array
- Dependencies:
  - patient persistence
  - patient history persistence
  - permission enforcement for `patient.read`
- Acceptance checklist:
  - missing patient returns not-found response
  - response includes normalized history actor fields
- Blockers:
  - current backend route returns only the raw patient row, not `{ patient, history }`

### BE-008 `PATCH /v1/patients/:id`

- Status: `In Progress`
- Priority: `P1`
- Contract source: `4.9 PATCH /api/patients/:id`
- Required outcomes:
  - validate positive integer patient id
  - require at least one allowed field
  - reject unknown fields
  - update patient and return normalized patient object
- Dependencies:
  - patient persistence
  - permission enforcement for `patient.write`
- Acceptance checklist:
  - empty patch body is rejected
  - partial update behavior is stable and documented
- Blockers:
  - current backend patch contract uses backend-native fields instead of the frontend contract fields

### BE-009 `DELETE /v1/patients/:id`

- Status: `Implemented`
- Priority: `P2`
- Contract source: `4.10 DELETE /api/patients/:id`
- Required outcomes:
  - validate positive integer patient id
  - delete patient or perform approved delete/archive strategy
  - return `{ "success": true }`
- Dependencies:
  - deletion policy decision
  - permission enforcement for `patient.delete`
- Acceptance checklist:
  - backend decides hard delete vs soft delete explicitly
  - frontend contract remains stable regardless of internal delete strategy
- Blockers:
  - endpoint exists as a soft delete and returns `{ "success": true }`, but authorization is still role-based rather than contract-level `patient.delete`

## 5.3 Patient History

### BE-010 `GET /v1/patients/:id/history`

- Status: `Implemented`
- Priority: `P1`
- Contract source: `4.11 GET /api/patients/:id/history`
- Required outcomes:
  - validate positive integer patient id
  - return normalized history list with actor metadata
- Dependencies:
  - patient history persistence
  - user lookup for actor names/roles
  - permission enforcement for `patient.history.read`
- Acceptance checklist:
  - response shape matches contract
  - empty history list is handled cleanly
- Blockers:
  - none currently documented

### BE-011 `POST /v1/patients/:id/history`

- Status: `Implemented`
- Priority: `P1`
- Contract source: `4.12 POST /api/patients/:id/history`
- Required outcomes:
  - validate positive integer patient id
  - validate `note`
  - reject unknown fields
  - record actor user id
  - return created history summary
- Dependencies:
  - patient history persistence
  - authenticated user resolution
  - permission enforcement for `patient.history.write`
- Acceptance checklist:
  - actor id is reliably captured
  - validation behavior matches contract
- Blockers:
  - endpoint stores actor user id, but it is not yet fully `Verified` against the frontend validation and error-envelope rules

## 5.4 User Management

### BE-012 `GET /v1/users`

- Status: `Implemented`
- Priority: `P1`
- Contract source: `4.13 GET /api/users`
- Required outcomes:
  - support optional `role` filter
  - validate `role` against allowed values
  - return normalized user list
- Dependencies:
  - user persistence
  - permission enforcement for `user.read`
- Acceptance checklist:
  - invalid role filter is rejected
  - response shape matches contract
- Blockers:
  - none currently documented

### BE-013 `POST /v1/users`

- Status: `In Progress`
- Priority: `P1`
- Contract source: `4.14 POST /api/users`
- Required outcomes:
  - validate name, email, password, and role
  - reject unknown fields
  - prevent duplicate emails
  - return normalized created user object
- Dependencies:
  - user persistence
  - password hashing
  - permission enforcement for `user.write`
- Acceptance checklist:
  - duplicate email handling is deterministic
  - response shape matches contract
- Blockers:
  - current backend request expects `firstName` and `lastName`, not the frontend contract field `name`

### BE-014 `POST /v1/auth/register`

- Status: `In Progress`
- Priority: `P1`
- Contract source: `4.15 POST /api/auth/register`
- Required outcomes:
  - support bootstrap owner creation when user count is zero
  - otherwise require user-write permission
  - validate same payload contract as user create
- Dependencies:
  - user persistence
  - bootstrap policy
  - permission enforcement for `user.write`
- Acceptance checklist:
  - first account can only be owner
  - subsequent registration behavior is explicit and secure
- Blockers:
  - request contract has the same mismatch as user create, and the response shape is not yet exactly aligned with the frontend contract

## 5.5 Clinical Terminology

### BE-015 `GET /v1/clinical/icd10`

- Status: `Implemented`
- Priority: `P1`
- Contract source: `4.16 GET /api/clinical/icd10?terms=...`
- Required outcomes:
  - accept `terms` query
  - return suggestion list for ICD-10 diagnosis search
  - preserve current frontend behavior:
    - fewer than 2 chars returns empty list
    - otherwise validate max length and return normalized suggestions
- Dependencies:
  - ICD-10 terminology source
  - permission enforcement for `clinical.icd10.read`
- Acceptance checklist:
  - endpoint is backed by a real terminology source
  - result ordering is stable enough for autocomplete use
  - latency is acceptable for clinician typing workflow
- Blockers:
  - backend endpoint exists and uses the external provider via `ICD10_API_BASE_URL`, but it is not yet `Verified` for production latency and stability expectations

## 6. Cross-Cutting Backend Tasks

### BE-016 Shared Validation Layer

- Status: `In Progress`
- Priority: `P0`
- Required outcomes:
  - backend request validation mirrors the frontend handoff contract
  - unknown-field rejection behavior is explicit
  - validation error envelope is consistent
- Current gap:
  - validation exists in backend `index.ts`, but it does not yet mirror the frontend contract uniformly

### BE-017 Shared Response Mapping

- Status: `In Progress`
- Priority: `P1`
- Required outcomes:
  - backend response serializers keep field names stable
  - snake_case response field names align with frontend contract where documented
- Current gap:
  - some endpoints normalize responses, but auth, patients, and users are not yet consistent across the contract surface

### BE-018 Permission Enforcement

- Status: `In Progress`
- Priority: `P0`
- Required outcomes:
  - backend enforces permissions independently of frontend routing
  - permission checks align with the documented permission names
- Current gap:
  - backend currently enforces auth independently, but the checks are role-based rather than permission-name based

### BE-019 Contract Tests

- Status: `In Progress`
- Priority: `P0`
- Required outcomes:
  - backend tests verify request validation
  - backend tests verify authorization failures
  - backend tests verify response shapes
- Current gap:
  - tests exist in `clinical-flow.test.ts`, but they do not yet cover full request validation, auth deny cases, and exact frontend contract shapes for every route

### BE-020 Store Replacement

- Status: `Not Started`
- Priority: `P0`
- Required outcomes:
  - production workflows no longer depend on `app/lib/store.ts`
  - backend becomes the source of truth for patient and user data
- Current gap:
  - from the backend repo alone, there is no proof the frontend has fully stopped depending on prototype internal/store-backed routes

## 7. What Is Actually Left

The main remaining backend work is now contract alignment rather than missing route creation.

- patient list, create, detail, and update need reshaping to the frontend contract
- user create and auth register need to accept the frontend-style `name` field or the frontend contract must be changed deliberately
- the validation error envelope is still not aligned uniformly
- backend authorization is still role-based, not based on the documented permission strings
- contract-level tests are still incomplete across validation, deny cases, and exact response shapes

## 8. Sign-Off Checklist

Do not declare backend alignment complete until all of the following are true:

- every `P0` item is at least `Implemented`
- every frontend-consumed route is either `Verified` or explicitly marked `Blocked` with an agreed workaround
- validation errors are stable and documented
- permission failures are enforced server-side
- the frontend no longer depends on prototype store-backed internal routes for production-path behavior

## 9. Companion Documents

- contract source: `docs/contracts/internal-api-contract-current.md`
- functional requirements baseline: `docs/requirements/functional-requirements-current.md`
- non-functional requirements baseline: `docs/requirements/non-functional-requirements-current.md`
