# Medsys Product And Engineering Roadmap

## Purpose

This document is the working roadmap for turning the current Medsys codebase into a production-grade healthcare platform that can support high scale, strong reliability, and regulated patient data handling.

It is intentionally practical and tied to the current repository state:

- Frontend: Next.js 16, React 19, TypeScript, Tailwind
- Current API access: `app/lib/api-client.ts`
- Current feature sections: `app/sections/*`
- Current local file-backed store: `app/lib/store.ts`
- Current quality gate: lint + typecheck + unit/component/route tests

## Current State Summary

The codebase already has a usable feature structure, but it is still at an early product maturity level.

Current strengths:

- Clear feature separation for owner, doctor, assistant, patient, and analytics sections
- TypeScript and centralized API client
- Shared page and API authorization policy now exists for shell routes and selected internal route handlers
- Same-origin auth proxy and signed session integration are in place
- Shared structural validation and response normalization now exist for selected internal route handlers
- Auth status/register, patient, patient-history, user, appointment, and assistant prescription/dispense browser flows now run through backend-backed `/api/...` BFF routes instead of the prototype store path
- Frontend compatibility adapters can now absorb only the remaining backend contract mismatches without spreading route-specific hacks through feature hooks
- Feature hooks are being used instead of placing all logic directly in components

Current gaps:

- File-based persistence is not suitable for concurrent production traffic
- Authorization is still coarse for domain actions beyond the currently covered internal routes
- Async state handling is inconsistent across features
- No mature server-state caching/invalidation layer
- Test coverage is improving, but still incomplete for critical healthcare workflows
- API schema validation is not yet complete across all backend-facing workflows
- Some backend-facing flows still require temporary frontend compatibility adapters because the backend contract is only partially aligned
- No visible audit logging, access governance, or compliance workflow

## Guiding Principles

1. Patient safety before UI convenience.
2. Data correctness before speed of feature delivery.
3. Secure-by-default architecture.
4. Explicit state, validation, and error handling.
5. Auditable workflows for every sensitive action.
6. Incremental delivery with clear exit criteria per phase.

## Roadmap Overview

### Phase 0: Stabilize The Current Frontend

Goal: reduce current code risk before larger platform changes.

Key changes:

- Standardize async UI state across feature hooks:
  - `idle`
  - `loading`
  - `success`
  - `error`
  - separate mutation states for create/update/dispense flows
- Replace coarse global error strings with scoped error handling:
  - page load errors
  - form validation errors
  - mutation errors
  - retryable sync errors
- Refactor feature props away from passing raw `setState` setters into child components
- Add proper empty states, loading states, disabled button states, and retry actions
- Add component and hook tests for existing assistant, doctor, patient, and profile flows
- Fix encoding and display issues in the UI where present

Initial targets in this repo:

- `app/sections/assistant/hooks/useAssistantWorkflow.ts`
- `app/sections/patient-profile/hooks/usePatientProfileData.ts`
- `app/sections/AssistantSection.tsx`
- `app/sections/doctor/hooks/*`
- `app/sections/patient/hooks/*`

Exit criteria:

- Every major screen has explicit loading, empty, success, and error behavior
- Core form flows provide user-visible validation feedback
- Tests exist for critical workflows, not just lint and typecheck

### Phase 1: Production Data And Auth Foundation

Goal: replace prototype-grade persistence and session handling.

Key changes:

- Replace `app/lib/store.ts` file-backed storage with a real backend data platform
- Introduce a relational database with migrations, indexing, backups, and restore strategy
- Define canonical domain models for:
  - users
  - organizations
  - patients
  - families
  - appointments
  - encounters
  - prescriptions
  - inventory
  - audit events
- Move auth from browser token storage toward secure server-managed session handling
- Use `httpOnly`, secure cookies and refresh rotation
- Add session invalidation, login event tracking, and device/session visibility
- Enforce organization scoping in every protected API request

Required backend/platform outcomes:

- Transaction-safe writes
- Concurrency-safe updates
- Referential integrity
- Real pagination, filtering, and indexing for list endpoints

Exit criteria:

- No production workflow depends on local JSON file storage
- No sensitive auth flow depends on `localStorage` as the primary trust boundary
- Backend supports multi-user concurrent operation safely

### Phase 2: Shared Data Access Pattern

Goal: make frontend data access predictable and maintainable.

Key changes:

- Introduce a proper server-state layer such as TanStack Query
- Define shared query keys, invalidation rules, stale-time rules, and mutation flows
- Standardize API response parsing and domain normalization
- Add typed schemas for request and response validation
- Centralize retry policy, timeout handling, and request cancellation
- Add optimistic updates only where correctness risk is low

Recommended frontend structure:

- domain query hooks per feature
- shared API contract types
- schema validation at boundaries
- minimal component-local state for UI-only concerns

Exit criteria:

- Feature pages do not manually reimplement fetch lifecycle logic repeatedly
- Queries and mutations have consistent caching and invalidation behavior
- API failures and retries behave consistently across the app

### Phase 3: Clinical Workflow Hardening

Goal: move from basic CRUD-style flows to safe healthcare workflows.

Key changes:

- Patient registration with duplicate detection and merge review
- Strong patient profile model with demographics, identifiers, contacts, family linkage, and timeline
- Appointment lifecycle rules with allowed transitions
- Encounter workflow with structured notes, diagnoses, tests, and follow-up actions
- Prescription lifecycle:
  - draft
  - reviewed
  - signed
  - queued
  - dispensed
  - partially dispensed
  - cancelled
- Inventory-aware dispensing with stock validation and reservation
- Allergy, interaction, and duplicate medication safety checks
- Abnormal vitals and clinical risk flagging

Clinical safety requirements:

- No silent fallback on critical data failures
- High-risk actions require explicit confirmation and audit trail
- Clinical status changes must be rule-driven, not only UI-driven

Exit criteria:

- Prescription and encounter flows enforce business rules consistently
- Inventory and dispensing are linked and auditable
- Safety alerts are visible in workflow-critical screens

### Phase 4: Security, Compliance, And Auditability

Goal: meet the operational and regulatory expectations of a healthcare platform.

Key changes:

- Full audit trail for create, update, delete, login, logout, record access, export, and dispense actions
- Shared permission-based authorization model expanded from shell and selected internal APIs to all sensitive workflows
- Access review and permission administration workflows
- Encryption for data in transit and at rest
- Secrets management and environment segregation
- Consent, data retention, and account recovery policy support
- Download/export controls for patient data
- Immutable or append-only audit event pipeline

Minimum audit event fields:

- actor id
- actor role
- organization id
- action type
- entity type
- entity id
- request id
- timestamp
- source IP / device metadata where appropriate
- before/after summary for sensitive changes

Exit criteria:

- Sensitive actions are traceable
- Access control is enforceable at API level
- Compliance review has concrete technical controls to inspect

### Phase 5: Reliability, Scale, And Operations

Goal: make the platform operable for large user volume.

Key changes:

- Structured logs with correlation IDs
- Metrics and tracing
- Alerting and dashboards
- Background job processing for retries, notifications, and heavy tasks
- Rate limiting and abuse protection
- Idempotency keys for mutation endpoints
- Database performance tuning and query profiling
- Caching strategy for safe read-heavy endpoints
- Load testing and failure-mode testing
- Backup verification and disaster recovery drills

Operational targets:

- defined SLOs / SLAs
- rollback strategy
- zero-downtime deployment approach
- incident response process

Exit criteria:

- The system can be observed, debugged, and recovered under pressure
- Critical flows have measurable latency and reliability targets

### Phase 6: Product Maturity Features

Goal: complete the platform beyond the core clinic workflow.

Key changes:

- Reporting and analytics by organization, role, time range, and operational category
- Billing/payment integrations where applicable
- Laboratory and imaging result ingestion
- Notifications:
  - appointment reminders
  - follow-up reminders
  - low-stock alerts
  - workflow exceptions
- Document upload and management
- Search across patients, encounters, prescriptions, and audit records
- Accessibility, localization, and timezone-safe presentation
- Mobile-responsive clinical workflows and printable records

Exit criteria:

- The platform supports daily operational needs beyond the minimum clinical workflow
- Reporting and supporting workflows reduce manual admin work

## Cross-Cutting Engineering Standards

These standards should apply in every phase.

### State Management

- Use local component state only for transient UI concerns
- Use feature hooks for feature-specific behavior
- Use shared server-state tooling for remote data
- Do not pass raw parent setters deep into child components unless the child is intentionally a controlled form primitive

### Validation

- Validate all user input at UI boundary
- Validate all API requests on the server
- Validate API responses before trusting them
- Never silently swallow critical validation errors

### Error Handling

- Separate user-correctable errors from system errors
- Provide retry paths for transient failures
- Do not convert critical data failures into empty data without visibility
- Log technical errors with request correlation

### Testing

Minimum required layers:

- unit tests for pure helpers and mappers
- component tests for critical UI behavior
- integration tests for route handlers and domain workflows
- end-to-end tests for role-based journeys

Critical workflows that must be covered early:

- login and refresh
- patient registration
- appointment creation
- doctor encounter completion
- prescription generation
- assistant dispense flow
- inventory adjustment
- authorization failures

### API Design

- Versioned endpoints
- Pagination for list endpoints
- Filter and sort contracts
- Idempotent mutation support where appropriate
- Consistent error envelope
- Request and response schemas documented and tested

## Immediate Next Work In This Repository

These should happen before broad feature expansion.

1. Expand permission coverage and schema validation to all backend-facing workflows.
2. Define and align target backend contracts for patients, appointments, encounters, prescriptions, and inventory.
3. Remove the remaining reliance on `app/lib/store.ts` for anything considered production-path.
4. Introduce a shared query/mutation layer for remote data.
5. Add audit logging for sensitive access and mutation flows.
6. Add integration and end-to-end coverage for authorization-sensitive and validation-sensitive workflows.

## Suggested Delivery Sequence

### Track A: Immediate Frontend Quality

- Tests
- validation
- loading/error state standardization
- hook refactors

### Track B: Backend And Security Foundation

- real persistence
- session architecture
- authorization model
- audit events

### Track C: Clinical Workflow Maturity

- prescriptions
- inventory
- encounter lifecycle
- patient identity and family management

### Track D: Scale And Operations

- observability
- background jobs
- rate limiting
- performance and resilience testing

## Decision Log Starters

As implementation begins, add decisions here or in a separate ADR folder.

Decisions that need to be made explicitly:

- database choice
- ORM or query layer choice
- auth/session architecture
- audit event storage model
- frontend server-state library choice
- test stack choice
- deployment and hosting model
- compliance target markets and obligations

## Ownership

This roadmap should be updated whenever:

- a phase is started or completed
- architecture direction changes
- compliance scope changes
- scaling assumptions change
- major product features are added or removed

The roadmap is a live engineering document, not a one-time note.
