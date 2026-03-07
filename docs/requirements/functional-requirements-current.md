# Medsys Functional Requirements

Current Behavior Baseline

Version: 1.0
Date: March 7, 2026
Document Status: Current implemented behavior snapshot
System: Medsys

## 1. Purpose

This document defines the current functional requirements of the Medsys application based on implemented behavior in the codebase as of March 7, 2026. It is intended to describe what the application does today, not the future-state roadmap.

## 2. Application Overview

Medsys is a role-based healthcare operations web application for clinic or small hospital workflows. The current product supports:

- doctor workspace activities for reviewing a waiting queue, opening patient context, and recording encounters
- assistant workflow activities for patient intake, dispense queue handling, and quick visit coordination
- patient search and directory access
- patient profile viewing across multiple clinical summary areas
- owner workspace activities for staff access review and internal permission presets
- inventory board visibility and stock adjustments
- analytics dashboard visibility
- AI insights and summary views
- centralized session-aware navigation and outage/error handling

The current system is structured as an internal operational tool rather than a patient-facing public portal.

## 3. Technology Stack Summary

The current application is implemented with the following stack:

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Vitest and Testing Library for unit and component tests
- Next.js route handlers for same-origin server endpoints
- signed application session cookies
- same-origin backend proxy for authenticated backend API access

## 4. Scope of This Document

This document covers behavior that is implemented in the current frontend and current application-side route handling. It does not claim that every listed workflow is clinically complete, compliant for production use, or fully integrated with a final enterprise backend.

## 5. User Roles

The current product recognizes the following application roles:

- doctor
- assistant
- owner

Role-based route checks currently control access to selected pages and redirect unauthorized users to the default route for their role.

## 6. Functional Requirements

## 6.1 Authentication And Session Management

FR-001. The system shall provide a login page for user authentication.

FR-002. The system shall submit login credentials to a same-origin application route instead of calling the backend directly from browser-held tokens.

FR-003. The system shall establish a signed application session after successful login.

FR-004. The system shall store backend access and refresh tokens in httpOnly cookies so they are not exposed to client-side JavaScript.

FR-005. The system shall provide a session check endpoint to identify the current authenticated user.

FR-006. The system shall redirect unauthenticated users to the login page before protected shell routes render.

FR-007. The system shall provide a logout action that clears the application session and backend authentication cookies.

FR-008. The system shall redirect authenticated users away from the login page to the role-appropriate landing page.

## 6.2 Shell, Routing, And Navigation

FR-009. The system shall render the main application shell only for authenticated users.

FR-010. The system shall provide navigation links for doctor, patient, analytics, inventory, AI, assistant, and owner areas.

FR-011. The system shall highlight the active navigation context.

FR-012. The system shall provide a logout control in the navigation panel.

FR-013. The system shall avoid rendering the main shell when backend availability checks fail and shall redirect the user to a dedicated system-unavailable page.

FR-014. The system shall render dedicated full-screen application error experiences for recoverable route errors and global failures.

## 6.3 Doctor Workspace

FR-015. The system shall provide a doctor landing page as the default route for doctor users.

FR-016. The doctor workspace shall load the waiting appointment queue.

FR-017. The doctor workspace shall load patient records needed for queue and profile context.

FR-018. The doctor workspace shall allow searching patients by name or NIC within the loaded patient data.

FR-019. The doctor workspace shall allow the user to select a queue patient and open patient context.

FR-020. The doctor workspace shall load clinical context for the selected patient, including vitals and allergies when available.

FR-021. The doctor workspace shall allow entry of encounter notes.

FR-022. The doctor workspace shall allow entry of one or more diagnoses.

FR-023. The doctor workspace shall allow entry of one or more requested tests.

FR-024. The doctor workspace shall allow entry of prescription items with drug name, dose, frequency, duration, quantity, and source.

FR-025. The doctor workspace shall allow a next visit date to be recorded.

FR-026. The doctor workspace shall submit a completed encounter to the backend.

FR-027. The doctor workspace shall surface explicit page-level error, loading, and fallback-warning states when source data is unavailable or partially unavailable.

## 6.4 Assistant Workflow

FR-028. The assistant workspace shall load the pending dispense queue.

FR-029. The assistant workspace shall load completed or recent appointment context used by the workflow.

FR-030. The assistant workspace shall load doctor reference data used when assigning a doctor to a new intake.

FR-031. The assistant workspace shall load current-user identity needed for dispense actions.

FR-032. The assistant workspace shall provide a patient intake form.

FR-033. The intake form shall support patient name, NIC, age, mobile number, priority, allergies, regular medication text, and blood group inputs in the user interface.

FR-034. The intake workflow shall validate required inputs before attempting patient creation.

FR-035. The intake workflow shall create a patient record through the backend patient endpoint.

FR-036. The intake workflow shall refresh assistant workspace data after successful patient creation.

FR-037. The assistant workspace shall allow selection of a pending dispense item.

FR-038. The assistant workspace shall display prescription detail for the selected pending item.

FR-039. The assistant workspace shall allow the assistant to complete a dispense action for a prescription.

FR-040. The dispense workflow shall use the authenticated assistant identity when constructing the dispense request.

FR-041. The dispense workflow shall refresh queue and related data after a successful dispense action.

FR-042. The assistant workspace shall provide explicit loading, empty, error, and retry states instead of silently failing.

## 6.5 Patient Directory

FR-043. The patient page shall list patients returned by the backend.

FR-044. The patient page shall support client-side search or filtering over the loaded directory data.

FR-045. The patient page shall allow opening patient profile details from the directory.

FR-046. The patient page shall surface explicit loading, empty, error, and fallback-warning states.

## 6.6 Patient Profile Experience

FR-047. The system shall provide a patient profile experience that can be opened from other workflows.

FR-048. The patient profile experience shall load profile summary data for a patient.

FR-049. The patient profile experience shall load family data for a patient when available.

FR-050. The patient profile experience shall load vitals, allergies, conditions, and timeline data when available.

FR-051. The patient profile experience shall display a clear warning when partial data loads fail and fallback rendering is being used.

FR-052. The patient profile experience shall provide retry behavior for failed page loads.

## 6.7 Analytics Dashboard

FR-053. The analytics page shall request analytics overview data from the backend.

FR-054. The analytics page shall display analytics summary content when analytics data is available.

FR-055. The analytics page shall provide explicit loading, empty, error, retry, and partial-data warning states.

## 6.8 Inventory Board

FR-056. The inventory page shall load the inventory item list.

FR-057. The inventory page shall support creation of a new inventory item.

FR-058. The inventory page shall support inventory quantity adjustments through movement actions.

FR-059. The inventory page shall allow inspection of inventory movement history for an item when available.

FR-060. The inventory page shall provide explicit loading, empty, error, retry, and partial-data warning states.

## 6.9 AI Insights Workspace

FR-061. The AI page shall load the data required for current AI insight summaries.

FR-062. The AI page shall present generated or derived insight cards from the available source data.

FR-063. The AI page shall provide explicit loading, empty, error, retry, and partial-data warning states.

## 6.10 Owner Workspace

FR-064. The owner page shall be restricted to owner-role users.

FR-065. The owner workspace shall load staff-related visibility data based on audit logs and appointment-derived context.

FR-066. The owner workspace shall display current staff or user access information assembled by the frontend workflow.

FR-067. The owner workspace shall provide permission preset controls in the user interface.

FR-068. The owner workspace shall support entry of new staff form data in the user interface.

FR-069. The owner workspace shall provide explicit loading, empty, error, retry, and fallback-warning states.

## 6.11 Error And System Availability Handling

FR-070. The system shall perform a backend health or availability check before rendering protected shell content.

FR-071. The system shall redirect to a full-screen unavailable page when the backend is unreachable or unhealthy.

FR-072. The system shall render route-level error pages for recoverable application failures.

FR-073. The system shall render a global full-screen error page for unrecoverable application failures.

FR-074. The system shall avoid showing the normal navigation shell on system-unavailable or full-screen error pages.

## 6.12 Common Async State Handling

FR-075. The system shall use explicit asynchronous page states for loading, ready, empty, and error conditions.

FR-076. The system shall expose retry actions where data loading can fail.

FR-077. The system shall disable relevant actions while mutations are in progress.

FR-078. The system shall show partial-data warnings when non-critical data fails and fallback rendering is still possible.

## 7. Current Functional Limitations And Exclusions

The following limits are part of the current implemented behavior and should be treated as known gaps rather than completed enterprise functionality:

- assistant intake exposes more fields in the UI than are fully persisted in the patient-create request
- the current assistant create-patient request hardcodes gender rather than taking a fully modeled intake gender value
- owner staff creation is currently a frontend workflow and permission modeling surface, not a completed production-grade staff administration integration
- AI insights are current derived summaries within the application experience, not a validated clinical decision support engine
- inventory operations are currently lightweight operational controls and not a full pharmacy inventory or controlled-substance management implementation
- there is no patient self-service portal, billing module, claims workflow, laboratory integration, imaging integration, or discharge workflow in the current build
- current role enforcement is page-oriented and not yet a full permission-matrix authorization model

## 8. Document Use

This document should be used as the baseline functional requirements reference for the current codebase. Future requirements documents should distinguish between current implemented behavior, approved future scope, and regulatory or operational obligations that are not yet implemented.
