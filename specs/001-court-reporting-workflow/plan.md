# Implementation Plan: Court Reporting Workflow Manager

**Branch**: `001-court-reporting-workflow` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-court-reporting-workflow/spec.md`

## Summary

Build a single-screen web dashboard for agency staff to manage court reporting jobs — creation,
reporter/editor assignment, status transitions (NEW → ASSIGNED → TRANSCRIBED → REVIEWED →
COMPLETED), and per-job payment display. Stack: React 18 + Vite frontend, Node.js + Express
backend, SQLite via better-sqlite3, all in TypeScript strict mode. No auth. Pre-seeded reporters
and editors; no CRUD UI for those entities.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, both frontend and backend)
**Primary Dependencies**: React 18 + Vite + Tailwind CSS (frontend), Express 4 + better-sqlite3 (backend)
**Storage**: SQLite via `better-sqlite3`; versioned `.sql` migration files applied on server startup
**Testing**: Not required by this feature spec (Jest + Supertest available if added later)
**Target Platform**: Desktop browser (Chrome/Firefox/Safari), Node.js 20 LTS server
**Project Type**: Web application (React + Vite frontend, Express backend)
**Performance Goals**: Job creation visible on dashboard in < 30 seconds (SC-001)
**Constraints**: Single-screen dashboard; no auth; no pagination; desktop only; no mobile
**Scale/Scope**: Single agency; assessment dataset (~10–50 jobs); no concurrent-user load targets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. TypeScript-First | All code in TS strict mode; no `any`; named interfaces for all API shapes | ✅ PASS |
| II. Explicit Workflow State Machine | Transitions modeled exclusively in service layer; no direct status writes from routes or controllers | ✅ PASS |
| III. Component-First React | Functional components; shared UI logic in custom hooks; state kept as local as possible | ✅ PASS |
| IV. Layered Node.js API | routes → controllers → services → data-access; controllers contain no business logic | ✅ PASS |
| V. SQLite Data Persistence | `better-sqlite3` in data-access layer only; raw SQL forbidden in controllers/services; versioned migrations on startup | ✅ PASS |
| VI. Code Clarity | No multi-line ternaries; explicit if/else for branching; self-documenting names throughout | ✅ PASS |

All gates pass. No Complexity Tracking entries required.

**Post-Phase-1 re-check**: All principles preserved in the data model and API contract design — see
research.md and data-model.md for detail.

## Project Structure

### Documentation (this feature)

```text
specs/001-court-reporting-workflow/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── routes/           # Express route definitions — thin; only wire paths to controllers
│   ├── controllers/      # Parse request, call service, shape response; zero business logic
│   ├── services/
│   │   ├── workflow.ts   # State machine: valid transition map + assertValidTransition()
│   │   ├── jobs.ts       # Job business logic (create, assign, advance)
│   │   ├── reporters.ts  # Reporter queries (available list, city sort)
│   │   └── editors.ts    # Editor queries
│   ├── data-access/
│   │   ├── jobs.ts       # All SQLite queries for jobs table
│   │   ├── reporters.ts  # All SQLite queries for reporters table
│   │   └── editors.ts    # All SQLite queries for editors table
│   ├── types/
│   │   └── shared.ts     # Named interfaces shared across layers; re-exported to frontend
│   └── db/
│       ├── index.ts      # DB connection singleton (better-sqlite3)
│       └── migrations/
│           ├── 001_init.sql   # Create tables: jobs, reporters, editors
│           └── 002_seed.sql   # Seed reporters (Jakarta × 2, Surabaya × 1) + editors
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx         # Root single-screen layout
│   │   ├── JobTable.tsx          # Job list with inline status, assignments, payments
│   │   ├── JobRow.tsx            # One row: details + action buttons
│   │   ├── CreateJobForm.tsx     # Form: case name, duration, location type, city
│   │   └── AssignModal.tsx       # Reporter / editor picker modal
│   ├── hooks/
│   │   ├── useDashboard.ts       # Fetch + refresh all jobs
│   │   └── useAssignment.ts      # Manage reporter/editor assignment flow
│   ├── services/
│   │   └── api.ts                # Typed fetch wrappers for all backend endpoints
│   └── types/
│       └── api.ts                # Mirror of backend/src/types/shared.ts
├── package.json
├── tsconfig.json
├── vite.config.ts                # Dev proxy: /api/* → http://localhost:3001
└── tailwind.config.ts            # Tailwind content paths + theme
```

**Structure Decision**: Web application layout (separate `frontend/` and `backend/` top-level
directories), as mandated by the constitution's Development Workflow section.

## Complexity Tracking

> No violations — all constitution principles satisfied without exception.
