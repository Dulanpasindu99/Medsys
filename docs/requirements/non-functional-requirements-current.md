# Medsys Non-Functional Requirements

Current Behavior Baseline

Version: 1.0
Date: March 7, 2026
Document Status: Current implemented behavior snapshot
System: Medsys

## 1. Purpose

This document defines the current non-functional requirements and engineering characteristics of the Medsys application based on implemented behavior in the codebase as of March 7, 2026. It describes quality attributes, constraints, and operational expectations that are visible in the current build.

## 2. Application Overview

Medsys is a role-based operational healthcare web application used by internal clinic staff. The current implementation emphasizes controlled shell access, session-aware routing, explicit UI state handling, and feature-specific workspaces for doctor, assistant, patient, inventory, analytics, AI, and owner functions.

## 3. Technology Stack Summary

The current non-functional baseline is shaped by the following technology choices:

- Next.js 16 App Router for routing, rendering, route handlers, and error boundaries
- React 19 for component composition and client interaction
- TypeScript 5 for static typing
- Tailwind CSS 4 for styling
- same-origin Next.js API routes used as an application-side authentication and backend proxy layer
- signed application session cookies and httpOnly backend token cookies
- Vitest, Testing Library, ESLint, and TypeScript checks in the test pipeline

## 4. Scope Of This Document

This document describes current implemented characteristics and current limitations. It is not a declaration of full enterprise compliance, clinical certification, production SLO commitment, or legal adequacy for healthcare regulation in every jurisdiction.

## 5. Non-Functional Requirements

## 5.1 Security And Privacy

NFR-001. The system shall keep application session state in a signed server-verifiable cookie rather than trusting browser-local identity state.

NFR-002. The system shall store backend access and refresh tokens in httpOnly cookies so client-side JavaScript cannot read them.

NFR-003. The system shall route authenticated backend API access through a same-origin application proxy rather than exposing backend bearer token handling directly in browser code.

NFR-004. The system shall clear application and backend authentication cookies on logout.

NFR-005. The system shall deny protected shell access to unauthenticated users.

NFR-006. The system shall enforce role-based page access for currently protected routes such as owner and assistant routes.

NFR-007. The system shall generate a request identifier header for API calls when the client has not already provided one.

NFR-008. The current build shall be treated as an application with healthcare-sensitive data and therefore as a candidate for stronger future controls such as permission matrices, structured auditability, and stricter backend validation.

## 5.2 Availability And Resilience

NFR-009. The system shall perform a backend availability gate before protected shell content is shown.

NFR-010. The system shall present a dedicated full-screen unavailable page when the backend is not reachable or not healthy.

NFR-011. The system shall provide route-level recoverable error handling through application error boundaries.

NFR-012. The system shall provide a global full-screen error boundary for unrecoverable failures.

NFR-013. The system shall avoid showing the normal application shell on full-screen outage or global error views.

NFR-014. The system shall support retry behavior from pages or panels when data loading failures occur.

NFR-015. The system shall refresh backend tokens through the application proxy when a backend request receives an authorization failure and refresh is still possible.

NFR-016. The system shall clear stale authentication state when proxy refresh fails.

## 5.3 Data Integrity And Correctness

NFR-017. The system shall use explicit asynchronous state models instead of relying only on implicit rendering side effects.

NFR-018. The system shall distinguish page-load failures from mutation failures where the implemented hook model supports separate state.

NFR-019. The system shall surface partial-data warnings when non-critical dependent data fails and fallback rendering is used.

NFR-020. The system shall avoid silently swallowing partial healthcare data failures when the user is still shown a rendered record.

NFR-021. The system shall use no-store style fetching where current authenticated user or live backend access state is being checked.

NFR-022. The current build shall be treated as not yet providing a complete end-to-end clinical data validation regime.

## 5.4 Performance And Responsiveness

NFR-023. The web user interface shall provide explicit loading states during asynchronous fetch and mutation operations.

NFR-024. The system shall disable relevant actions while in-flight mutations are running to reduce duplicate submissions.

NFR-025. The system shall support responsive navigation and page composition across desktop and smaller viewports.

NFR-026. The current build shall not be interpreted as having a formally defined latency SLO, throughput benchmark, or scale certification for millions of concurrent users.

NFR-027. The current same-origin proxy architecture shall add an extra application hop to backend requests in exchange for stronger token handling and session control.

## 5.5 Usability And User Experience

NFR-028. The system shall use a consistent main shell and navigation model for authenticated internal users.

NFR-029. The system shall provide clear empty, loading, error, and retry states in major data-driven sections.

NFR-030. The system shall provide fallback-warning notices when the user is seeing incomplete data instead of silently implying full completeness.

NFR-031. The system shall redirect users to role-appropriate default routes when they are authenticated but attempt to enter a disallowed route.

NFR-032. The system shall provide full-screen interruption pages for outage and fatal error conditions so the user is not left inside a broken shell.

## 5.6 Maintainability And Modularity

NFR-033. The system shall organize feature logic into section-specific hooks rather than placing all asynchronous logic directly in page components.

NFR-034. The system shall centralize backend request behavior in a shared API client layer.

NFR-035. The system shall centralize application-side auth, session, and proxy concerns in dedicated library and route-handler modules.

NFR-036. The system shall keep shared async-state primitives reusable across multiple sections.

NFR-037. The system shall keep documentation artifacts in source-controlled form so they can be revised as the implementation changes.

## 5.7 Testability And Quality Controls

NFR-038. The system shall provide automated linting through ESLint.

NFR-039. The system shall provide static type checking through TypeScript.

NFR-040. The system shall provide unit or component test execution through Vitest and Testing Library.

NFR-041. The system shall include tests for feature hooks, feature sections, and selected auth or proxy route behavior.

NFR-042. The current repository test command shall execute linting, type checking, and unit tests as part of a single verification flow.

NFR-043. The current test baseline shall be understood as useful but still incomplete for a production healthcare platform.

## 5.8 Observability And Operational Support

NFR-044. The system shall provide user-visible error messaging for failed requests at the page or panel level.

NFR-045. The current build shall not be treated as having a full observability stack such as centralized structured logs, metrics dashboards, distributed tracing, alerting, or audit analytics.

NFR-046. The current build shall not be treated as having formal runbook automation, disaster recovery automation, or zero-downtime deployment guarantees.

## 5.9 Compliance, Accessibility, And Governance

NFR-047. The current build shall be treated as a healthcare-sensitive application that requires future compliance and governance work beyond what is currently implemented.

NFR-048. The current build shall not be represented as fully compliant with HIPAA, local privacy law, or healthcare regulatory controls solely on the basis of the present codebase.

NFR-049. The current build shall not be represented as containing a complete permission-matrix authorization framework, formal consent management, or immutable audit trail enforcement.

NFR-050. The current build shall not be represented as having completed accessibility certification or localization coverage.

## 6. Current Non-Functional Gaps And Constraints

The following are current engineering limits that should be treated as known gaps:

- no formal production SLOs, SLAs, or performance benchmark evidence are documented in the repository
- no complete enterprise observability stack is present in the current codebase
- no complete compliance framework or legal evidence package is present in the current codebase
- no full permission-matrix authorization model is implemented yet
- no formal server-state caching or query orchestration library has been introduced across all features
- some feature workflows still depend on backend contract maturity and should not be treated as operationally complete
- current documentation reflects implemented behavior, not regulatory sign-off or enterprise deployment readiness

## 7. Document Use

This document should be used as the baseline non-functional reference for the current codebase. Future versions should separate implemented characteristics, target architecture, operational commitments, compliance obligations, and formal production acceptance criteria.
