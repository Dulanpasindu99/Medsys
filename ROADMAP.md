# Medsys Roadmap

Execution And Phase Tracking

Version: 1.0
Date: March 11, 2026
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

Status: In Progress

Goal:

- tighten write-flow behavior, user feedback, and remaining policy alignment now that the architecture is stable

Current focus:

- mutation feedback consistency
- mutation invalidation consistency
- action-level permission affordance review
- removal of remaining server-side compatibility debt where backend contracts are already stable

## Remaining Work By Track

## Track A: Mutation UX And Invalidation

Status: In Progress

Remaining items:

- review write-heavy workflows for success/error messaging consistency
- ensure query invalidation after writes is consistent
- tighten retry behavior where mutations fail

## Track B: Permission And Action Alignment

Status: In Progress

Remaining items:

- review visible UI actions against live backend permissions
- prevent user-facing actions that predictably return `403`

## Track C: Adapter Reduction

Status: In Progress

Remaining items:

- trim `app/lib/backend-contract-adapters.ts` further as backend contracts stabilize
- keep backend-compatibility logic server-side only

## Next Step

Immediate next coding target:

1. harden mutation feedback and invalidation in the remaining write-heavy screens
2. complete the remaining action-level permission affordance review
3. trim any leftover server-side adapter paths that are no longer needed

## Reference Documents

- Client document: `docs/Medsys_Client_Documentation.md`
- Developer document: `docs/Medsys_Developer_Documentation.md`
