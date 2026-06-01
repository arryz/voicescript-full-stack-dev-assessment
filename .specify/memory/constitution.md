<!--
## Sync Impact Report

**Version change**: 1.0.0 → 1.1.0
**Bump rationale**: MINOR — added TypeScript-First and Workflow State Machine principles; added
Assessment Scope section; project name and tech stack aligned to AutoScript JD.

### Modified Principles
- "Component-First UI" → "Component-First React" (wording refined)
- "RESTful API Layer" → "Layered Node.js API" (renamed for clarity)
- "Simplicity" → folded into Governance (removed as standalone principle)
- Tech Stack: language pinned to TypeScript; JavaScript option removed

### Added Sections
- Principle I: TypeScript-First
- Principle II: Explicit Workflow State Machine
- Assessment Scope

### Removed Sections
- Standalone Simplicity principle (rule retained in Governance)

### Templates Reviewed
- `.specify/templates/plan-template.md` ✅ — Constitution Check is dynamic; no update required
- `.specify/templates/spec-template.md` ✅ — no constitution-specific references; no update required
- `.specify/templates/tasks-template.md` ✅ — no constitution-specific references; no update required
- `.specify/templates/commands/` — directory not present; skipped

### Deferred Items
- None
-->

# AutoScript Full Stack Assessment Constitution

## Assessment Scope

This is an interview code project for the AutoScript Fullstack TypeScript Developer role. The
assessment covers building a **job workflow management system** for court reporters: job assignment,
status transitions (pending → assigned → in_progress → review → completed), and payment tracking.
The evaluator is looking for practical, real-world systems — not tutorial-style code.

## Core Principles

### I. TypeScript-First

All code — frontend and backend — MUST be written in TypeScript. `any` is PROHIBITED unless the
type is genuinely unknowable at compile time, and each use MUST be justified with a comment.
Every API request and response shape MUST be expressed as a named interface or type, shared between
frontend and backend where feasible.

**Rationale**: The JD lists "Strong TypeScript skills" as a hard requirement; the evaluator will
read types as a signal of design intent.

### II. Explicit Workflow State Machine

Job status transitions MUST be modeled as an explicit state machine in the service layer. Only
valid transitions are permitted (e.g., `pending → assigned`, `assigned → in_progress`); attempts
to jump to an invalid state MUST be rejected with a typed error. No component or route handler is
allowed to write a job status directly — all transitions go through the state machine service.

**Rationale**: The assessment explicitly tests "assignment logic and state transitions." A clearly
bounded state machine demonstrates the design thinking the role requires.

### III. Component-First React

UI MUST be built from composable React functional components, each with a single clear
responsibility. Shared UI logic MUST live in custom hooks. State MUST be kept as local as possible;
lift to a higher scope only when two or more components need the same piece of state.

### IV. Layered Node.js API

The Express backend MUST be structured in distinct layers: routes → controllers → services →
data-access. Controllers MUST NOT contain business logic — delegate to service functions. Services
MUST NOT contain HTTP-specific code (no `req`/`res`). The workflow state machine (Principle II)
lives exclusively in the service layer.

### V. SQLite Data Persistence

All persistent data MUST be stored in SQLite. A dedicated data-access layer handles all queries;
raw SQL in controllers or services is PROHIBITED. Schema changes MUST be managed via versioned
migration files applied on server startup.

### VI. Code Clarity — No Long Ternaries

Conditional logic with more than a single, self-evident inline result MUST use if/else statements.
Ternary expressions spanning multiple lines or nesting more than one condition are PROHIBITED —
break them into explicit if/else blocks. Variable and function names MUST be self-documenting.

**Rationale**: Interview code is read under time pressure; explicit branches communicate intent
without ambiguity and reduce reviewer cognitive load.

## Tech Stack

- **Frontend**: React (functional components + hooks), `frontend/`
- **Backend**: Node.js + Express, `backend/`
- **Language**: TypeScript throughout (strict mode enabled)
- **Database**: SQLite via `better-sqlite3`
- **Shared types**: `shared/` package or `backend/src/types/` re-exported to frontend
- **Testing**: Jest + Supertest — include only when explicitly requested in the feature spec

## Development Workflow

Frontend and backend MUST live in separate top-level directories (`frontend/`, `backend/`) and each
MUST be independently runnable. API contracts (typed request/response interfaces) MUST be agreed
upon before implementation begins. All changes MUST pass TypeScript compilation and lint checks.

## Governance

This constitution supersedes all other project practices. Build only what the current spec requires;
premature abstractions and speculative features are PROHIBITED — complexity MUST be justified in the
plan's Complexity Tracking table. Amendments require: (1) documenting the change and motivation,
(2) a semantic version bump, and (3) a migration note if existing work is affected. All
implementation plans MUST include a Constitution Check gate before Phase 0 research.

**Version**: 1.1.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
