# Medical Backend Implementation Playbook

This document is a production-oriented blueprint for implementing the backend as a **separate repository** for your medical application.

It is based on the current frontend flow and data cues in:
- `app/sections/DoctorSection.tsx`
- `app/sections/AssistantSection.tsx`
- `app/sections/PatientSection.tsx`
- `app/sections/OwnerSection.tsx`
- `app/sections/AnalyticsSection.tsx`
- `app/data/patientProfiles.ts`
- `app/data/diagnosisMapping.ts`

## 1. Goals

- Build a serious, maintainable, secure backend for clinical workflows.
- Keep frontend and backend as separate deployable systems.
- Provide strict data integrity and auditable actions suitable for medical operations.

## 2. Recommended Stack (Production)

- Language: `TypeScript` (Node.js 20 LTS)
- Framework: `NestJS` (Fastify adapter)
- ORM: `Prisma`
- Database: `PostgreSQL 16+`
- Cache/Queue: `Redis` (session/rate-limit/job queue)
- Auth: `JWT access + refresh token rotation`
- API Docs: `OpenAPI/Swagger`
- Logging: `Pino` structured logs
- Observability: `OpenTelemetry` + centralized log store
- Infra: Docker, CI/CD, managed Postgres backups

## 3. Repository and Service Architecture

## 3.1 Repositories

- `medsys-web` (frontend)
- `medsys-api` (backend)

## 3.2 Backend Layering

- `controllers`: transport/HTTP only
- `dto`: request/response contracts + validation
- `services`: business logic
- `repositories`: DB operations (via Prisma)
- `guards/interceptors/filters`: auth, request-id, error envelope

## 3.3 Backend Modules

- `auth`
- `users`
- `patients`
- `appointments`
- `encounters`
- `prescriptions`
- `inventory`
- `analytics`
- `audit`

## 4. Domain Flow (Medical-Safe)

1. Patient registration/update
2. Appointment creation (queue)
3. Encounter starts (doctor consultation)
4. Add diagnoses + tests + notes
5. Create prescription + prescription items
6. Dispensing/assistant completion
7. Follow-up scheduling
8. Audit logs generated for each sensitive action

Rules:
- No hard delete for clinical records.
- Every critical write is traceable (who/when/from where).
- Prescription must attach to encounter.
- Encounter should tie to appointment.

## 5. Database Schema (PostgreSQL)

Use `snake_case` table names and explicit constraints.

## 5.1 Enums

- `user_role`: `owner`, `doctor`, `assistant`
- `gender`: `male`, `female`, `other`
- `appointment_status`: `waiting`, `in_consultation`, `completed`, `cancelled`
- `priority_level`: `normal`, `urgent`, `critical`
- `allergy_severity`: `low`, `moderate`, `high`
- `drug_source`: `Clinical`, `Outside`
- `inventory_category`: `medicine`, `supply`, `equipment`
- `inventory_movement_type`: `in`, `out`, `adjustment`
- `test_order_status`: `ordered`, `completed`, `cancelled`

## 5.2 Tables and Columns

### `users`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 bytes | No | PK |
| uuid | uuid | 16 bytes | No | Unique external ID |
| email | citext | <=254 | No | Unique, case-insensitive |
| password_hash | text | - | No | PBKDF2/Argon2 hash |
| full_name | varchar | 150 | No | |
| role | user_role | - | No | owner/doctor/assistant |
| is_active | boolean | 1 | No | default true |
| created_at | timestamptz | - | No | |
| updated_at | timestamptz | - | No | |

Indexes:
- `ux_users_email (email unique)`
- `ix_users_role_is_active (role, is_active)`

### `refresh_tokens`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| user_id | bigint | 8 | No | FK users.id |
| token_hash | text | - | No | SHA-256 hash of refresh token |
| expires_at | timestamptz | - | No | |
| revoked_at | timestamptz | - | Yes | |
| created_at | timestamptz | - | No | |

Indexes:
- `ix_refresh_tokens_user_expires (user_id, expires_at)`

### `patients`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| uuid | uuid | 16 | No | Unique external ID |
| nic | varchar | 20 | Yes | Unique national id if available |
| full_name | varchar | 180 | No | |
| dob | date | - | Yes | |
| gender | gender | - | Yes | |
| phone | varchar | 30 | Yes | |
| address | text | - | Yes | |
| blood_group | varchar | 5 | Yes | `A+`, `O-`, etc |
| is_active | boolean | 1 | No | soft status |
| created_at | timestamptz | - | No | |
| updated_at | timestamptz | - | No | |

Indexes:
- `ux_patients_nic (nic unique where nic is not null)`
- `ix_patients_full_name (full_name)`

### `patient_allergies`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| patient_id | bigint | 8 | No | FK patients.id |
| allergy_name | varchar | 120 | No | |
| severity | allergy_severity | - | Yes | |
| created_at | timestamptz | - | No | |

Indexes:
- `ix_patient_allergies_patient (patient_id)`

### `appointments`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| patient_id | bigint | 8 | No | FK patients.id |
| doctor_id | bigint | 8 | Yes | FK users.id |
| assistant_id | bigint | 8 | Yes | FK users.id |
| scheduled_at | timestamptz | - | No | |
| status | appointment_status | - | No | default waiting |
| reason | text | - | Yes | |
| priority | priority_level | - | No | default normal |
| created_at | timestamptz | - | No | |
| updated_at | timestamptz | - | No | |

Indexes:
- `ix_appointments_status_scheduled_at (status, scheduled_at)`
- `ix_appointments_patient_id (patient_id)`
- `ix_appointments_doctor_scheduled_at (doctor_id, scheduled_at)`

### `encounters`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| appointment_id | bigint | 8 | No | FK appointments.id, unique |
| patient_id | bigint | 8 | No | FK patients.id |
| doctor_id | bigint | 8 | No | FK users.id |
| notes | text | - | Yes | doctor notes |
| next_visit_date | date | - | Yes | |
| created_at | timestamptz | - | No | |

Indexes:
- `ux_encounters_appointment (appointment_id unique)`
- `ix_encounters_patient_created_at (patient_id, created_at desc)`

### `encounter_diagnoses`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| encounter_id | bigint | 8 | No | FK encounters.id |
| icd10_code | varchar | 16 | Yes | e.g. J20.9 |
| diagnosis_name | varchar | 255 | No | |

Indexes:
- `ix_encounter_diagnoses_encounter (encounter_id)`
- `ix_encounter_diagnoses_icd10 (icd10_code)`

### `test_orders`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| encounter_id | bigint | 8 | No | FK encounters.id |
| test_name | varchar | 180 | No | |
| status | test_order_status | - | No | default ordered |
| created_at | timestamptz | - | No | |

Indexes:
- `ix_test_orders_encounter (encounter_id)`

### `prescriptions`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| encounter_id | bigint | 8 | No | FK encounters.id |
| patient_id | bigint | 8 | No | FK patients.id |
| doctor_id | bigint | 8 | No | FK users.id |
| created_at | timestamptz | - | No | |

Indexes:
- `ix_prescriptions_patient_created_at (patient_id, created_at desc)`
- `ix_prescriptions_encounter_id (encounter_id)`

### `prescription_items`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| prescription_id | bigint | 8 | No | FK prescriptions.id |
| drug_name | varchar | 180 | No | |
| dose | varchar | 60 | Yes | e.g. 500MG |
| frequency | varchar | 80 | Yes | e.g. TDS |
| duration | varchar | 80 | Yes | e.g. 5 days |
| quantity | numeric | 12,2 | No | |
| source | drug_source | - | No | Clinical/Outside |

Indexes:
- `ix_prescription_items_prescription (prescription_id)`

### `inventory_items`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| sku | varchar | 80 | Yes | Unique if present |
| name | varchar | 180 | No | |
| category | inventory_category | - | No | |
| unit | varchar | 20 | No | tablet/ml/box |
| stock | numeric | 12,2 | No | default 0 |
| reorder_level | numeric | 12,2 | No | default 0 |
| is_active | boolean | 1 | No | soft status |
| created_at | timestamptz | - | No | |
| updated_at | timestamptz | - | No | |

Indexes:
- `ux_inventory_items_sku (sku unique where sku is not null)`
- `ix_inventory_items_name (name)`
- `ix_inventory_items_stock_reorder (stock, reorder_level)`

### `inventory_movements`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| inventory_item_id | bigint | 8 | No | FK inventory_items.id |
| movement_type | inventory_movement_type | - | No | in/out/adjustment |
| quantity | numeric | 12,2 | No | positive value |
| reference_type | varchar | 30 | Yes | e.g. prescription |
| reference_id | bigint | 8 | Yes | |
| note | text | - | Yes | |
| created_by_id | bigint | 8 | No | FK users.id |
| created_at | timestamptz | - | No | |

Indexes:
- `ix_inventory_movements_item_created_at (inventory_item_id, created_at desc)`

### `audit_logs`
| Column | Type | Size | Null | Notes |
|---|---|---:|---|---|
| id | bigserial | 8 | No | PK |
| actor_user_id | bigint | 8 | Yes | FK users.id |
| entity_type | varchar | 60 | No | patient/prescription/auth/... |
| entity_id | bigint | 8 | Yes | |
| action | varchar | 30 | No | viewed/created/updated/... |
| ip | inet | - | Yes | |
| user_agent | text | - | Yes | |
| payload | jsonb | - | Yes | redacted metadata only |
| created_at | timestamptz | - | No | |

Indexes:
- `ix_audit_logs_created_at (created_at desc)`
- `ix_audit_logs_entity (entity_type, entity_id)`

## 5.3 Relationship Summary

- `patients 1..n appointments`
- `appointments 1..1 encounters` (recommended by business rule)
- `encounters 1..n encounter_diagnoses`
- `encounters 1..n test_orders`
- `encounters 1..n prescriptions`
- `prescriptions 1..n prescription_items`
- `inventory_items 1..n inventory_movements`
- `users` referenced by appointments, encounters, prescriptions, inventory_movements, audit_logs

## 6. API Contract Rules

- Base path: `/api/v1`
- JSON only, UTF-8
- `request_id` in every response header and error body
- Consistent error format:
```json
{
  "error": {
    "code": 400,
    "message": "Validation failed",
    "request_id": "uuid",
    "timestamp": "ISO-8601"
  }
}
```
- Pagination for list endpoints: `?page=1&limit=20`
- Sort/filters explicit and whitelisted

## 7. Security and Compliance Baseline

Important: final compliance depends on your jurisdiction and legal counsel.  
Use this as technical baseline (HIPAA-like posture).

## 7.1 Identity and Access

- JWT access token: 10-15 minutes
- Refresh token rotation, server-side token hash store
- Revoke tokens on logout/password change
- RBAC:
  - `owner`: admin/staff config
  - `doctor`: clinical data write
  - `assistant`: operational/dispensing actions
- Optional MFA for owner/admin accounts

## 7.2 Data Protection

- TLS everywhere (`HTTPS`)
- Encrypt DB volumes and backups
- Never store plain passwords
- Minimize PII in logs
- Redact sensitive fields in audit payload

## 7.3 Audit and Traceability

Must log:
- login success/failure
- patient record viewed
- diagnosis/prescription created/updated
- inventory adjustments
- user/role changes

Audit fields: actor, action, entity, timestamp, IP, user-agent, request-id.

## 7.4 Clinical Safety Rules

- No hard delete of clinical records
- Transaction boundary for critical clinical writes:
  - create encounter
  - add diagnoses/tests
  - create prescription + items
  - optional inventory movement
- Input validation on every endpoint (`class-validator`/`zod`)
- Optimistic locking for concurrent edit-sensitive entities (optional `version` column)

## 8. Step-by-Step Implementation Plan

## Phase 0: Bootstrap Repo

1. Create separate backend repo (`medsys-api`).
2. Setup NestJS + Prisma + Postgres connection.
3. Add CI jobs: lint, test, build.

## Phase 1: Data Foundation

1. Implement schema above in Prisma models.
2. Generate migration and apply to dev DB.
3. Seed roles/users and sample patients.

## Phase 2: Auth + RBAC

1. Implement `/auth/login`, `/auth/refresh`, `/auth/logout`.
2. Add JWT guard + role guard.
3. Add refresh token persistence and revocation.

## Phase 3: Core Clinical Modules

1. Patients CRUD (safe update + read audit).
2. Appointments CRUD + queue status flow.
3. Encounters create/read.
4. Diagnoses + tests write endpoints.
5. Prescriptions + prescription items endpoints.

## Phase 4: Inventory and Assistant Workflow

1. Inventory item CRUD.
2. Inventory movement transactions.
3. Optional dispense endpoint linked to prescription.

## Phase 5: Analytics + Audit Endpoints

1. `/analytics/overview` with aggregate queries.
2. `/audit/logs` privileged access only.

## Phase 6: Hardening

1. Add request-id middleware/interceptor.
2. Add global exception filter.
3. Add rate limiting and stricter CORS.
4. Add health/readiness checks.
5. Add backup + restore verification process.

## 9. Mapping From Frontend to Backend Entities

Based on current frontend fields:

- `patientProfiles.nic`, `name`, `age`, `gender`, `mobile`, `allergies`, `conditions`, `timeline`
  - maps to: `patients`, `patient_allergies`, `encounters`, `encounter_diagnoses`
- Doctor sheet (`selectedDiseases`, `selectedTests`, `rxRows`, `nextVisitDate`, notes)
  - maps to: `encounters`, `encounter_diagnoses`, `test_orders`, `prescriptions`, `prescription_items`
- Assistant panel (`pendingPatients`, medications, done/next flow)
  - maps to: `appointments.status`, dispensing transaction, inventory movement
- Owner panel (staff creation + permissions)
  - maps to: `users`, role claims (RBAC)
- Analytics panel (disease counts, gender, trend)
  - query from: `encounter_diagnoses`, `encounters`, `patients`, `appointments`

## 10. Engineering Rules (Must Enforce)

- Never put business logic in controllers.
- Every write endpoint must validate DTO.
- Every sensitive read/write must be auditable.
- All list endpoints must support pagination.
- Database migrations are append-only; never edit old applied migrations.
- No destructive scripts in production without approval process.
- Enforce code review for clinical-domain changes.

## 11. Minimal Endpoint Set (First Release)

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users`, `POST /users` (owner-only)
- `GET /patients`, `POST /patients`, `PATCH /patients/:id`
- `GET /appointments`, `POST /appointments`, `PATCH /appointments/:id`
- `POST /encounters`
- `POST /encounters/:id/diagnoses`
- `POST /encounters/:id/tests`
- `POST /prescriptions`, `GET /prescriptions/:id`
- `GET /inventory`, `POST /inventory`, `POST /inventory/:id/movements`
- `GET /analytics/overview`
- `GET /audit/logs` (owner-only)

## 12. Go-Live Checklist

- [ ] Separate backend repo deployed
- [ ] DB backups configured and restore tested
- [ ] JWT rotation enabled
- [ ] Role guards active
- [ ] Audit logs verified for sensitive flows
- [ ] Monitoring + alerting configured
- [ ] Swagger disabled in production (or protected)
- [ ] Penetration/security review completed

