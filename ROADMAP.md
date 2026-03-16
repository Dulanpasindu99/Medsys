# Medsys Roadmap

Execution And Phase Tracking

Version: 1.1
Date: March 16, 2026
Status: Active

## Purpose

This roadmap is the live execution tracker for the Medsys frontend repository. It is intentionally shorter than the client and developer documents and exists to track delivery phases, current status, and next steps.

## Current Position

- Frontend BE-020: completed
- Backend-backed BFF architecture: completed for active production flows
- Shared query layer rollout for core read-heavy sections: completed
- Prototype store retirement: completed
- Documentation consolidation: completed

## Phase Summary

## Phase 1: Frontend Stabilization

Status: Completed

Completed outcomes:

- explicit loading, empty, error, and retry states across major sections
- improved hook-based feature state management
- initial unit and component test foundation

## Phase 2: Auth And Backend Foundation

Status: Completed

Completed outcomes:

- signed app session model
- secure backend auth cookies
- backend refresh handling through the BFF layer
- route and shell protection

## Phase 3: BFF Migration And Contract Alignment

Status: Completed

Completed outcomes:

- patients, users, appointments, encounters, prescriptions, inventory, analytics, audit logs, ICD-10, and patient-profile support feeds on backend-backed `/api/...` routes
- browser-side direct `/v1/...` production calls removed
- frontend BE-020 closure achieved

## Phase 4: Shared Query Layer Rollout

Status: Completed

Completed outcomes:

- TanStack Query provider and shared query keys
- query-backed reads for:
  - auth/current-user and auth status
  - patient directory
  - doctor workspace reads
  - assistant reads
  - owner reads
  - analytics
  - AI
  - patient-profile
  - inventory board

## Phase 5: Cleanup And Artifact Retirement

Status: Completed

Completed outcomes:

- browser-side adapter debt reduced
- stable read-feed contract guards moved into the API client
- prototype store removed
- documentation reduced to:
  - client document
  - developer document
  - roadmap

## Current Active Phase

## Phase 6: Workflow Hardening

Status: Completed

Goal:

- tighten write-flow behavior, user feedback, and remaining policy alignment now that the architecture is stable

Completed outcomes:

- mutation feedback consistency across the remaining write-heavy workflows
- mutation invalidation and refetch consistency after writes
- action-level permission affordance review across assistant, doctor, owner, and inventory workflows
- removal of the remaining browser-side adapter coupling for active client flows

## Remaining Work By Track

## Track A: Mutation UX And Invalidation

Status: Completed

Completed items:

- review write-heavy workflows for success/error messaging consistency
- ensure query invalidation after writes is consistent
- tighten retry behavior where mutations fail

## Track B: Permission And Action Alignment

Status: Completed

Completed items:

- review visible UI actions against live backend permissions
- prevent user-facing actions that predictably return `403`

## Track C: Adapter Reduction

Status: Completed

Completed items:

- trim `app/lib/backend-contract-adapters.ts` further as backend contracts stabilize
- keep backend-compatibility logic server-side only

## Next Step

Steady-state follow-up:

1. maintain shared query invalidation and permission-aligned affordances for new workflows
2. trim remaining server-side adapter paths only when backend contracts stabilize further
3. keep the full quality gate green before shipping new feature work

## Reference Documents

- Client document: `docs/Medsys_Client_Documentation.md`
- Developer document: `docs/Medsys_Developer_Documentation.md`
