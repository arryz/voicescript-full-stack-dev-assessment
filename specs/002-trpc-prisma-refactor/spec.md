# Feature Specification: Type-Safe API and Data Layer Refactor

**Feature Branch**: `002-trpc-prisma-refactor`  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: User description: "I wanna to refactor to implement https://trpc.io/ and https://www.prisma.io/"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Updates API Without Breaking the Frontend (Priority: P1)

A developer changes a backend endpoint — for example, renaming a field returned by the jobs API. The system immediately alerts them to every frontend location that relies on the old field name before any code is run or deployed.

**Why this priority**: The most painful category of bugs in the current codebase is silent API contract drift — the frontend fetches data the backend no longer sends, or sends fields the backend no longer accepts. Catching this at authoring time eliminates a whole class of regression.

**Independent Test**: A developer can rename a field on the jobs data shape and see compile-time errors pointing to every affected UI component — without running the app.

**Acceptance Scenarios**:

1. **Given** a developer renames a field on a backend data type, **When** they save the file, **Then** the editor immediately highlights all frontend code that referenced the old field name.
2. **Given** a developer adds a required input to an API operation, **When** the frontend calls that operation without the new field, **Then** a build error is produced before the change can be deployed.
3. **Given** all frontend consumers have been updated, **When** the build runs, **Then** it completes without errors and all existing tests pass.

---

### User Story 2 - Developer Modifies the Database Schema Safely (Priority: P2)

A developer needs to add a new column to the jobs table or rename an existing one. The system provides a structured, version-controlled path to do so — and the data-access layer reflects the change automatically.

**Why this priority**: Currently schema changes require manually editing raw SQL migration files and updating separate TypeScript types. Divergence between these two sources of truth causes subtle runtime bugs. A single source of truth for the schema eliminates this risk.

**Independent Test**: A developer can add a new optional field to the jobs schema and immediately query/insert it through the data-access layer in a type-checked way — with no manual TypeScript updates required.

**Acceptance Scenarios**:

1. **Given** a developer adds a new field to the jobs schema definition, **When** they run the data migration command, **Then** the database is updated and the data-access layer exposes the new field with correct types.
2. **Given** a database schema change is made, **When** the application starts, **Then** it confirms the database matches the expected schema before accepting requests.
3. **Given** a migration introduces a breaking change, **When** a developer attempts to query a removed field, **Then** a compile-time error is produced.

---

### User Story 3 - Existing Workflows Remain Fully Functional After Refactor (Priority: P3)

All existing court-reporting workflow features — job listing, reporter assignment, editor assignment, and status transitions — continue to operate exactly as before from the user's perspective.

**Why this priority**: The refactor must deliver zero regression to end users. Functional correctness of the existing system is a hard constraint, not a goal to be optimised.

**Independent Test**: A tester can exercise the complete assign-reporter → assign-editor → complete-job workflow and observe identical behavior to the current production system.

**Acceptance Scenarios**:

1. **Given** the refactored system is running, **When** a user views the job list dashboard, **Then** all jobs are displayed with correct status, assignment, and pay information.
2. **Given** the refactored system is running, **When** a user assigns a reporter or editor to a job, **Then** the assignment is persisted and reflected in the UI without a page reload.
3. **Given** the refactored system is running, **When** a user performs a workflow state transition, **Then** the transition succeeds and all downstream computed fields update correctly.

---

### Edge Cases

- When a migration fails mid-run, the operation is fully rolled back and the database is left in its pre-migration state (atomic transaction).
- How does the system behave when a frontend client built against an older API contract connects to a newer backend?
- What happens if the database file is missing or corrupted on startup?
- How are currently-running requests handled during a schema migration?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST ensure that any mismatch between the data shape the backend produces and the data shape the frontend consumes is caught before the application runs.
- **FR-002**: The system MUST provide a single, authoritative definition of the database schema that the data-access layer derives its types from automatically.
- **FR-003**: The system MUST support version-controlled, sequential database schema migrations that can be applied without data loss.
- **FR-004**: All existing API operations — listing jobs, listing reporters, listing editors, assigning a reporter, assigning an editor, and transitioning job status — MUST be preserved with identical inputs, outputs, and business rules.
- **FR-005**: The system MUST surface schema or contract violations as errors at build time or development time, not at runtime.
- **FR-006**: The data-access layer MUST expose full create, read, update, and delete operations for jobs, reporters, and editors.
- **FR-007**: The system MUST seed the database with the existing test data set on a fresh install, preserving the same records currently in the seed migration.
- **FR-008**: The development experience MUST allow a developer to run the full stack locally with a single command sequence (install → migrate → start).

### Key Entities

- **Job**: A court-reporting assignment with status, scheduled date, location, pay rate, and optional reporter and editor assignments.
- **Reporter**: A person available to be assigned to a job; has a name and city.
- **Editor**: A person available to edit/process a completed job recording; has a name.
- **Assignment**: The association between a Job and a Reporter or Editor, with a defined lifecycle (unassigned → assigned → completed).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero runtime type-mismatch errors occur during a full end-to-end walkthrough of all existing workflows after the refactor.
- **SC-002**: All previously passing tests continue to pass after the refactor with no modifications to test assertions.
- **SC-003**: A developer can introduce an intentional API contract mismatch and receive a build error within 5 seconds, without running the application.
- **SC-004**: A fresh-install setup (install dependencies, apply migrations, start servers) completes in under 3 minutes on a standard development machine.
- **SC-005**: The data-access layer requires zero hand-written type definitions for database entities — all types are derived from the schema definition.
- **SC-006**: Integration tests covering list, assign, and status-transition operations exist for the new typed API layer and pass in CI.

## Clarifications

### Session 2026-06-01

- Q: Are existing REST routes fully removed or kept alongside the new typed API layer? → A: Fully replaced — all Express REST routes are deleted; only the new typed API layer remains.
- Q: When a database schema migration fails, what is the expected recovery behavior? → A: Atomic transaction — migration rolls back entirely on failure; database is left unchanged.
- Q: Are new tests required for the refactored API and data-access layer, beyond confirming existing tests still pass? → A: New integration tests required — key API operations (list, assign, transition) must have integration test coverage in the new layer.

## Assumptions

- The SQLite database engine is retained; the refactor targets the ORM/query layer and API contract layer only, not the underlying database engine.
- The existing court-reporting domain model (jobs, reporters, editors, workflow states) is not changing as part of this refactor — only the technical implementation layer is being replaced.
- The two-server architecture (separate frontend dev server and backend API server) is retained.
- Existing seed data (the records currently loaded by the SQL seed migration) must be preserved exactly.
- The refactor is an internal engineering change; no end-user-visible behavior, UI, or feature set changes as a result.
- There are no external consumers of the current REST API — the only client is the bundled frontend application.
- All existing Express REST route handlers are deleted as part of this refactor; no REST endpoints survive alongside the new typed API layer.
