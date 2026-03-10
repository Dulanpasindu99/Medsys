# Medsys Internal API Contract

Current Validation And Response Baseline

Version: 1.0
Date: March 9, 2026
Audience: Backend and integration teams
Status: Current implemented application-side contract

Companion execution tracker: `docs/contracts/backend-implementation-checklist.md`

## 1. Purpose

This document describes the current internal API contract enforced by the Medsys Next.js application routes. It is intended as a backend handoff reference for validation rules, permission expectations, and response shapes currently enforced in the frontend application layer.

Current implementation note:

- `GET /api/auth/status`
- `POST /api/auth/register`
- `GET/POST /api/patients`
- `GET/PATCH/DELETE /api/patients/:id`
- `GET/POST /api/patients/:id/history`
- `GET/POST /api/users`

now run as backend-backed BFF routes over backend `/v1/...` endpoints. These routes validate browser payloads in the Next.js layer, call the backend with server-side credentials, and normalize backend responses before they reach the browser.

## 2. Authorization Model

Internal route handlers use the shared permission model defined in `app/lib/authorization.ts` and enforced through `app/lib/api-auth.ts`.

Current permission coverage relevant to these routes:

- `patient.read`
- `patient.write`
- `patient.delete`
- `patient.history.read`
- `patient.history.write`
- `user.read`
- `user.write`
- `clinical.icd10.read`

The same shared policy also drives shell route access and navigation visibility.

## 3. Validation Error Envelope

When request validation fails, handlers return HTTP `400` with this structure:

```json
{
  "error": "Validation failed.",
  "issues": [
    {
      "field": "name",
      "message": "Is required."
    }
  ]
}
```

Rules:

- `field` identifies the request property or parameter that failed validation
- unknown request properties are rejected with `Unknown field.`
- invalid JSON bodies are rejected with `body: Must be valid JSON.`
- non-object JSON bodies are rejected with `body: Must be a JSON object.`

## 4. Route Contracts

## 4.1 `POST /api/auth/login`

Permission:

- public route

Accepted body:

```json
{
  "email": "doctor@example.com",
  "password": "secret-123",
  "roleHint": "doctor",
  "organizationId": "11111111-1111-1111-1111-111111111111"
}
```

Validation rules:

- `email` is required, trimmed, lowercased, valid email, max 160 chars
- `password` is required, string, min 8 chars, max 128 chars
- `roleHint` is optional and if present must be one of `owner | doctor | assistant`
- `organizationId` is optional, trimmed string, max 64 chars
- extra keys are rejected

Backend dependency contract:

- backend login response must be a JSON object with:
  - `accessToken`: non-empty string
  - `refreshToken`: non-empty string
  - `expiresIn`: optional positive number

Success response:

```json
{
  "id": 42,
  "name": "Dr. Jane Doe",
  "email": "doctor@example.com",
  "role": "doctor"
}
```

Failure behavior:

- invalid client payload returns the validation error envelope with `400`
- malformed backend token payload returns `502`
- backend unavailability returns `503`

## 4.2 `POST /api/auth/logout`

Permission:

- no request body

Success response:

```json
{
  "success": true
}
```

Behavior:

- clears backend auth cookies
- clears signed session cookie

## 4.3 `GET /api/auth/me`

Permission:

- authenticated session required

Success response:

```json
{
  "id": 42,
  "name": "Dr. Jane Doe",
  "email": "doctor@example.com",
  "role": "doctor"
}
```

## 4.4 `GET /api/auth/status`

Permission:

- public route

Behavior:

- backend-backed BFF route over `GET /v1/auth/status`
- used to determine first-user bootstrap state before registration and login UX decisions

Success response:

```json
{
  "bootstrapping": false,
  "users": 3
}
```

## 4.5 `/api/backend/:path*`

Permission:

- backend access-token cookie required

Behavior:

- forwards request to `BACKEND_URL`
- forwards selected headers only
- injects backend bearer token server-side
- on backend `401`, uses refresh-token cookie to request new backend tokens
- retries the original request once after successful refresh
- clears backend and session cookies if refresh fails or the refreshed token payload is invalid

Backend refresh contract:

- refresh response must be a JSON object with:
  - `accessToken`: non-empty string
  - `refreshToken`: non-empty string
  - `expiresIn`: optional positive number

## 4.6 `GET /api/patients`

Permission:

- `patient.read`

Request:

- no body

Response:

```json
{
  "patients": [
    {
      "id": 7,
      "name": "Jane Doe",
      "date_of_birth": "1990-06-01",
      "phone": "555-2222",
      "nic": "990011223V",
      "age": 31,
      "gender": "female",
      "priority": "high",
      "address": "42 Main Street",
      "created_at": "2026-03-09T00:00:00.000Z"
    }
  ]
}
```

## 4.7 `POST /api/patients`

Permission:

- `patient.write`

Accepted body:

```json
{
  "name": "Jane Doe",
  "dateOfBirth": "1990-06-01",
  "phone": "555-2222",
  "address": "42 Main Street",
  "nic": "990011223V",
  "age": 31,
  "gender": "female",
  "mobile": "555-2222",
  "priority": "high"
}
```

Validation rules:

- `name` is required, trimmed, string, max 120 chars
- `dateOfBirth` is optional, nullable, and if present must use `YYYY-MM-DD`
- `phone` is optional, nullable, string, max 30 chars
- `address` is optional, nullable, string, max 255 chars
- `nic` is optional, nullable, string, max 32 chars
- `age` is optional and if present must be an integer `>= 0`
- `gender` is optional and if present must be one of `male | female | other`
- `mobile` is optional, nullable, string, max 30 chars
- `priority` is optional and if present must be one of `low | normal | high | critical`
- extra keys are rejected

Success response:

```json
{
  "patient": {
    "id": 9,
    "name": "Jane Doe",
    "date_of_birth": "1990-06-01",
    "phone": "555-2222",
    "mobile": "555-2222",
    "nic": "990011223V",
    "age": 31,
    "gender": "female",
    "priority": "high",
    "address": "42 Main Street",
    "created_at": "2026-03-09T00:00:00.000Z"
  }
}
```

## 4.8 `GET /api/patients/:id`

Permission:

- `patient.read`

Validation rules:

- `id` must be a positive integer

Success response:

```json
{
  "patient": {
    "id": 7,
    "name": "Jane Doe",
    "date_of_birth": null,
    "phone": null,
    "nic": "990011223V",
    "age": 31,
    "gender": "female",
    "address": null,
    "created_at": "2026-03-09T00:00:00.000Z"
  },
  "history": [
    {
      "id": 3,
      "note": "Observed for 24 hours",
      "created_at": "2026-03-09T00:00:00.000Z",
      "created_by_user_id": 1,
      "created_by_name": "Doctor User",
      "created_by_role": "doctor"
    }
  ]
}
```

## 4.9 `PATCH /api/patients/:id`

Permission:

- `patient.write`

Accepted body keys:

- `name`
- `dateOfBirth`
- `phone`
- `address`
- `nic`
- `age`
- `gender`
- `mobile`
- `priority`

Validation rules:

- body must include at least one allowed field
- provided fields follow the same rules as patient create
- extra keys are rejected
- `id` must be a positive integer

Success response:

```json
{
  "patient": {
    "id": 7,
    "name": "Jane Doe",
    "date_of_birth": "1990-06-01",
    "phone": "555-2222",
    "mobile": "555-2222",
    "nic": "990011223V",
    "age": 31,
    "gender": "female",
    "priority": "high",
    "address": "42 Main Street",
    "created_at": "2026-03-09T00:00:00.000Z"
  }
}
```

## 4.10 `DELETE /api/patients/:id`

Permission:

- `patient.delete`

Validation rules:

- `id` must be a positive integer

Success response:

```json
{
  "success": true
}
```

## 4.11 `GET /api/patients/:id/history`

Permission:

- `patient.history.read`

Validation rules:

- `id` must be a positive integer

Success response:

```json
{
  "history": [
    {
      "id": 3,
      "note": "Observed for 24 hours",
      "created_at": "2026-03-09T00:00:00.000Z",
      "created_by_user_id": 1,
      "created_by_name": "Doctor User",
      "created_by_role": "doctor"
    }
  ]
}
```

## 4.12 `POST /api/patients/:id/history`

Permission:

- `patient.history.write`

Accepted body:

```json
{
  "note": "Observed for 24 hours"
}
```

Validation rules:

- `id` must be a positive integer
- `note` is required, trimmed string, max 1000 chars
- extra keys are rejected

Success response:

```json
{
  "id": 3,
  "patientId": 7,
  "note": "Observed for 24 hours",
  "createdByUserId": 1
}
```

## 4.13 `GET /api/users`

Permission:

- `user.read`

Optional query params:

- `role`: `owner | doctor | assistant`

Validation rules:

- invalid `role` query values are rejected with the validation error envelope

Success response:

```json
{
  "users": [
    {
      "id": 4,
      "name": "Owner User",
      "email": "owner@example.com",
      "role": "owner",
      "created_at": "2026-03-09T00:00:00.000Z"
    }
  ]
}
```

## 4.14 `POST /api/users`

Permission:

- `user.write`

Accepted body:

```json
{
  "name": "Dr. Jane Doe",
  "email": "doctor@example.com",
  "password": "strong-pass-123",
  "role": "doctor"
}
```

Validation rules:

- `name` is required, trimmed string, max 120 chars
- `email` is required, trimmed, lowercased, valid email, max 160 chars
- `password` is required, string, min 8 chars, max 128 chars
- `role` must be one of `owner | doctor | assistant`
- extra keys are rejected

Success response:

```json
{
  "user": {
    "id": 10,
    "name": "Dr. Jane Doe",
    "email": "doctor@example.com",
    "role": "doctor",
    "created_at": "2026-03-09T00:00:00.000Z"
  }
}
```

## 4.15 `POST /api/auth/register`

Permission:

- bootstrapping case: first user can self-register only as `owner`
- otherwise: `user.write`

Accepted body:

```json
{
  "name": "Owner User",
  "email": "owner@example.com",
  "password": "owner-pass-123",
  "role": "owner"
}
```

Validation rules:

- same body rules as `POST /api/users`
- if no users exist, first account must be `owner`

Success response:

```json
{
  "user": {
    "id": 11,
    "name": "Owner User",
    "email": "owner@example.com",
    "role": "owner",
    "created_at": "2026-03-09T00:00:00.000Z"
  }
}
```

Bootstrapping behavior:

- on first-owner registration, the BFF registers through backend `/v1/auth/register`, then performs backend login and sets:
  - backend access-token cookie
  - backend refresh-token cookie
  - signed app session cookie

## 4.16 `GET /api/clinical/icd10?terms=...`

Permission:

- `clinical.icd10.read`

Validation rules:

- if `terms` has fewer than 2 characters, the route returns an empty suggestion list
- otherwise `terms` must be a trimmed string with max 100 chars

Success response:

```json
{
  "suggestions": [
    "A00 - Cholera"
  ]
}
```

## 5. Current Limitations

- request and response schemas are implemented in the application layer, not yet in a shared backend package
- route responses are now normalized for the listed internal routes, but not every application route has been migrated to the same level of domain validation depth
- validation currently enforces structural correctness and basic field constraints, not deep clinical domain rules
- auth status/register, patient, patient-history, and user production-path browser flows are now backend-backed BFF routes, but some other internal routes still remain store-backed or partially adapted

## 6. Source Of Truth In Code

- validation helpers: `app/lib/api-validation.ts`
- response serializers: `app/lib/api-serializers.ts`
- permission model: `app/lib/authorization.ts`
- API auth helpers: `app/lib/api-auth.ts`
