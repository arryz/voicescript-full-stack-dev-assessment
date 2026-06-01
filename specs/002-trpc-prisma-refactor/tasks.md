# Tasks: Type-Safe API and Data Layer Refactor

**Input**: Design documents from `/specs/002-trpc-prisma-refactor/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Integration tests explicitly required per spec.md clarification (SC-006): list, assign, and transition operations must have integration test coverage in the new tRPC layer.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths relative to repo root

---

## Phase 1: Setup (Install Dependencies & Configuration)

**Purpose**: Install new packages and create environment config so all subsequent phases compile.

- [ ] T001 Add backend production dependencies (@trpc/server@11, @prisma/client@5, zod@3) to backend/package.json and run npm install in backend/
- [ ] T002 [P] Add frontend production dependencies (@trpc/client@11, @trpc/react-query@11, @tanstack/react-query@5) to frontend/package.json and run npm install in frontend/
- [ ] T003 [P] Add backend dev dependencies (prisma@5, ts-node, @types/jest, jest, ts-jest) to backend/package.json devDependencies and run npm install in backend/
- [ ] T004 [P] Create backend/.env with DATABASE_URL="file:./data/court_reporting.db"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure every user story depends on — Prisma schema, initial migration, tRPC base wiring, and shared types.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Create backend/prisma/schema.prisma with generator (prisma-client-js), datasource (sqlite, env DATABASE_URL), and models Reporter, Editor, Job exactly as specified in data-model.md (including @@map directives, nullable FKs, and DateTime fields)
- [ ] T006 Run `npx prisma migrate dev --name init` from backend/ to generate backend/prisma/migrations/…_init/ SQL files and regenerate the Prisma client in backend/node_modules/.prisma/client/
- [ ] T007 [P] Create backend/src/trpc/context.ts exporting createContext function that instantiates and returns a PrismaClient; export Context type inferred from createContext return
- [ ] T008 [P] Create backend/src/trpc/schemas.ts with Zod schemas: CreateJobSchema, AssignReporterSchema, AssignEditorSchema, JobIdSchema, ListReportersSchema as defined in data-model.md
- [ ] T009 Update backend/src/types/shared.ts to re-export Prisma-generated types (Reporter, Editor, Job) via `export type { Reporter, Editor, Job } from '@prisma/client'` and define JobListItem, CreateJobRequest, AssignReporterRequest, AssignEditorRequest as specified in data-model.md

**Checkpoint**: Foundation ready — `npx tsc --noEmit` in backend/ passes; Prisma client types are importable. User story implementation can now begin.

---

## Phase 3: User Story 1 — Developer Updates API Without Breaking the Frontend (Priority: P1) 🎯 MVP

**Goal**: Establish the end-to-end TypeScript type chain: Prisma schema → tRPC procedures → AppRouter type export → frontend tRPC client → React hooks. Any mismatch between what the backend returns and what the frontend expects is a compile-time error.

**Independent Test**: Rename `reporter_name` to `reporterName` in the return mapping inside `backend/src/trpc/routers/jobs.ts`, then run `cd frontend && npm run build`. TypeScript must report errors pointing to every frontend location that reads `reporter_name` — with no app startup required. Revert to confirm build is clean.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Rewrite backend/src/data-access/jobs.ts using PrismaClient: implement listJobs (findMany with include reporter+editor, compute reporter_pay = duration_minutes × rate_per_minute and editor_pay = flat_fee in TypeScript, return JobListItem[]), getJobById, createJob, and updateJob
- [ ] T011 [P] [US1] Rewrite backend/src/data-access/reporters.ts using PrismaClient: implement listReporters with optional jobCity filter (city equality match) returning Reporter[]
- [ ] T012 [P] [US1] Rewrite backend/src/data-access/editors.ts using PrismaClient: implement listEditors returning Editor[]
- [ ] T013 [P] [US1] Create backend/src/trpc/routers/jobs.ts with jobs sub-router: list query (no input → JobListItem[]), create mutation (CreateJobSchema → JobListItem), assignReporter mutation (AssignReporterSchema → JobListItem), markTranscribed mutation (JobIdSchema → JobListItem), assignEditor mutation (AssignEditorSchema → JobListItem), complete mutation (JobIdSchema → JobListItem); delegate to service layer for all business logic; catch WorkflowError → TRPCError CONFLICT, NotFoundError → NOT_FOUND, ValidationError → BAD_REQUEST
- [ ] T014 [P] [US1] Create backend/src/trpc/routers/reporters.ts with reporters sub-router: list query (ListReportersSchema → Reporter[])
- [ ] T015 [P] [US1] Create backend/src/trpc/routers/editors.ts with editors sub-router: list query (no input → Editor[])
- [ ] T016 [US1] Create backend/src/trpc/router.ts: instantiate tRPC via initTRPC.context<Context>().create(), assemble appRouter from jobs, reporters, and editors sub-routers, export appRouter and `export type AppRouter = typeof appRouter`
- [ ] T017 [US1] Update backend/src/index.ts to import createExpressMiddleware from @trpc/server/adapters/express, mount `app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }))`, and remove all imports and app.use() calls referencing backend/src/routes/
- [ ] T018 [P] [US1] Update frontend/tsconfig.json compilerOptions to add `"paths": { "@backend/*": ["../backend/src/*"] }` and ensure baseUrl is set to "."
- [ ] T019 [P] [US1] Update frontend/vite.config.ts to add `resolve: { alias: { '@backend': path.resolve(__dirname, '../backend/src') } }` using path import from node:path
- [ ] T020 [US1] Create frontend/src/lib/trpc.ts: `import { createTRPCReact } from '@trpc/react-query'; import type { AppRouter } from '@backend/trpc/router'; export const trpc = createTRPCReact<AppRouter>();`
- [ ] T021 [US1] Update frontend/src/main.tsx to import QueryClient and QueryClientProvider from @tanstack/react-query and trpc + httpBatchLink, create queryClient and trpcClient instances, wrap App render with `<trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}>…</QueryClientProvider></trpc.Provider>`
- [ ] T022 [US1] Update frontend/src/types/api.ts to remove all manual REST-derived type definitions and replace with types inferred from AppRouter (e.g. `type JobListItem = inferRouterOutputs<AppRouter>['jobs']['list'][number]`)
- [ ] T023 [US1] Update frontend/src/hooks/useDashboard.ts to replace all fetch() calls with trpc.jobs.list.useQuery(), trpc.reporters.list.useQuery({ jobCity }), and trpc.editors.list.useQuery()
- [ ] T024 [US1] Update frontend/src/hooks/useAssignment.ts to replace all fetch() calls with trpc.jobs.assignReporter.useMutation(), trpc.jobs.markTranscribed.useMutation(), trpc.jobs.assignEditor.useMutation(), and trpc.jobs.complete.useMutation()
- [ ] T025 [P] [US1] Delete backend/src/routes/ directory (all Express REST route handler files removed; tRPC router is the only API surface)
- [ ] T026 [P] [US1] Delete backend/src/controllers/ directory (all REST controller files removed)
- [ ] T027 [P] [US1] Delete frontend/src/services/api.ts (REST fetch client replaced entirely by tRPC React hooks)

**Checkpoint**: Run `cd backend && npx tsc --noEmit` and `cd frontend && npm run build` — both compile with zero TypeScript errors. User Story 1 is independently verified by the rename test described above.

---

## Phase 4: User Story 2 — Developer Modifies the Database Schema Safely (Priority: P2)

**Goal**: Establish Prisma as the single source of truth for the database schema so that adding or renaming a field in schema.prisma automatically propagates to TypeScript types with no manual updates — and the migration is version-controlled and repeatable.

**Independent Test**: Add `notes String?` to the Job model in backend/prisma/schema.prisma, run `npx prisma migrate dev --name add-notes` in backend/, then open backend/src/data-access/jobs.ts and verify `prisma.job.findMany()` return type includes `notes: string | null` with full type-checking — without editing any TypeScript file.

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create backend/prisma/seed.ts using PrismaClient to upsert seed records: reporters Adi Santoso (Jakarta), Budi Hartono (Jakarta), Citra Dewi (Surabaya), Dian Permata (Bandung, is_available=false) all with rate_per_minute=2000; editors Eka Rahardjo and Farah Yunita both with flat_fee=50000; wrap in try/finally to disconnect PrismaClient
- [ ] T029 [US2] Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` field to backend/package.json and add script `"db:setup": "prisma migrate dev --name init && prisma db seed"` to backend/package.json scripts
- [ ] T030 [US2] Delete backend/src/db/ directory (better-sqlite3 database setup and migration runner code replaced by Prisma)

**Checkpoint**: Run `cd backend && npm run db:setup` against a clean data/ directory — migration applies, Prisma client regenerates, seed inserts 4 reporters and 2 editors. Confirm with `npx prisma studio` or a direct query.

---

## Phase 5: User Story 3 — Existing Workflows Remain Fully Functional After Refactor (Priority: P3)

**Goal**: Confirm zero regression — all existing court-reporting workflows (list jobs, assign reporter, mark transcribed, assign editor, complete job) operate identically through the new tRPC + Prisma stack, verified by integration tests using createCallerFactory against a real SQLite test database.

**Independent Test**: Run `cd backend && npm test` — all integration tests pass. Then manually start both servers and execute the full assign-reporter → mark-transcribed → assign-editor → complete workflow in the browser and observe identical behavior to the pre-refactor system.

### Tests for User Story 3

> **Write these tests against the real implementation and confirm they pass green after Phase 3 + Phase 4 are complete.**

- [ ] T031 [US3] Create backend/src/tests/helpers/testDb.ts: export setupTestDb() that creates a PrismaClient connected to `file:./test.db`, runs `prisma migrate deploy`, seeds reporters and editors, and returns the client; export teardownTestDb() that deletes all rows and disconnects; configure backend/jest.config.ts with ts-jest preset and testEnvironment=node
- [ ] T032 [P] [US3] Create backend/src/tests/jobs.list.test.ts: use createCallerFactory(appRouter) with testDb context; assert jobs.list returns an array where each item has id, case_name, status, reporter_pay (number), editor_pay (number), reporter_name (string|null), editor_name (string|null) with correct computed values after seeding a test job
- [ ] T033 [P] [US3] Create backend/src/tests/jobs.workflow.test.ts: seed a job and assert the full state machine — jobs.assignReporter transitions status to ASSIGNED and sets reporter_id; jobs.markTranscribed transitions to TRANSCRIBED; jobs.assignEditor transitions to REVIEWED and sets editor_id; jobs.complete transitions to COMPLETED; assert jobs.assignReporter on a COMPLETED job throws TRPCError with code CONFLICT
- [ ] T034 [P] [US3] Create backend/src/tests/reporters.test.ts: assert reporters.list returns all reporters; assert reporters.list({ jobCity: 'Jakarta' }) returns only reporters whose city matches
- [ ] T035 [P] [US3] Create backend/src/tests/editors.test.ts: assert editors.list returns all editors with id and name fields

### Validation for User Story 3

- [ ] T036 [US3] Run `npm test && npm run lint` in backend/ and frontend/ and resolve all failures so CI is fully green

**Checkpoint**: `npm test` passes for all 5 test files. `npm run lint` exits 0 in both packages. Manual walkthrough of the dashboard in the browser shows all jobs, reporter assignment, and status transitions working as before.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate freshinstall experience and confirm SC-003 and SC-004 success criteria are met end-to-end.

- [ ] T037 Update README.md: replace the Tech Stack table (better-sqlite3 → Prisma 5.x, add tRPC v11 + TanStack Query v5 rows); replace the "Start the Backend" instructions with the new three-step sequence (npm install → npm run db:setup → npm run dev); update the Vite proxy note from `/api/*` → `/trpc`; add `npm run db:setup` to the Backend Available Scripts table; update "Resetting the Database" section to use `npm run db:setup` instead of manual migration restart
- [ ] T038 [P] Validate SC-004 (fresh-install under 3 minutes): on a clean checkout run `cd backend && npm install && npm run db:setup && npm run dev` then `cd frontend && npm install && npm run dev`; confirm both servers start and the dashboard loads in under 3 minutes total
- [ ] T039 [P] Validate SC-003 (compile-time contract mismatch in under 5 seconds): rename `reporter_name` → `reporterName` in the return mapping of backend/src/trpc/routers/jobs.ts, run `cd frontend && npm run build`, confirm TypeScript reports errors within 5 seconds, then revert and confirm clean build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Phase 2 completion
  - Phase 3 (US1): No dependency on US2 or US3
  - Phase 4 (US2): No dependency on US1 or US3; can start in parallel with Phase 3 after Phase 2
  - Phase 5 (US3): Depends on Phase 3 AND Phase 4 both complete (tests exercise the full tRPC + Prisma stack)
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — independent of US2 and US3
- **US2 (P2)**: After Phase 2 — independent of US1 and US3
- **US3 (P3)**: After both US1 and US2 — the integration tests run the full tRPC layer (US1) against the Prisma + seeded database (US2)

### Within Each User Story

- Data-access rewrites (T010–T012) before tRPC sub-routers (T013–T015)
- Sub-routers (T013–T015) before root AppRouter (T016)
- AppRouter (T016) before backend/src/index.ts update (T017) and frontend tRPC client (T020)
- Frontend client (T020) before main.tsx (T021) and hook updates (T023–T024)
- Old file deletions (T025–T027, T030) after replacement files are complete

### Parallel Opportunities

- T001, T002, T003, T004 can all run in parallel (Phase 1)
- T007, T008 can run in parallel during Phase 2 (different files, both depend on T005)
- T010, T011, T012 can run in parallel (different data-access files)
- T013, T014, T015 can run in parallel (different sub-router files)
- T018, T019 can run in parallel (different config files)
- T025, T026, T027 can run in parallel (different directories to delete)
- T028, T029 can run in parallel within Phase 4 (T030 can only follow T001's npm install completing)
- T032, T033, T034, T035 can all run in parallel (different test files)

---

## Parallel Example: User Story 1

```bash
# After T007 and T009 complete, launch data-access rewrites together:
Task T010: Rewrite backend/src/data-access/jobs.ts
Task T011: Rewrite backend/src/data-access/reporters.ts
Task T012: Rewrite backend/src/data-access/editors.ts

# After T010–T012 complete, launch sub-routers together:
Task T013: Create backend/src/trpc/routers/jobs.ts
Task T014: Create backend/src/trpc/routers/reporters.ts
Task T015: Create backend/src/trpc/routers/editors.ts

# After T016 completes (AppRouter), launch config in parallel:
Task T018: Update frontend/tsconfig.json
Task T019: Update frontend/vite.config.ts
```

## Parallel Example: User Story 3

```bash
# After T031 (testDb helper) completes, launch all test files together:
Task T032: Create backend/src/tests/jobs.list.test.ts
Task T033: Create backend/src/tests/jobs.workflow.test.ts
Task T034: Create backend/src/tests/reporters.test.ts
Task T035: Create backend/src/tests/editors.test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (tRPC procedures + frontend type-sharing)
4. **STOP and VALIDATE**: Perform the field-rename test. Confirm zero TypeScript errors on green build.
5. Demo the type-safe API contract to stakeholders if needed.

### Incremental Delivery

1. Phase 1 + Phase 2 → infrastructure ready
2. Phase 3 (US1) → type-safe API live; demonstrate SC-003 field-rename test → **MVP deliverable**
3. Phase 4 (US2) → schema migration workflow live; demonstrate add-field test
4. Phase 5 (US3) → integration tests green; full regression coverage → **production-ready deliverable**
5. Phase 6 → SC-003 and SC-004 metrics confirmed

---

## Notes

- [P] tasks operate on different files and can be executed concurrently by parallel agents
- [US1]/[US2]/[US3] labels trace each task to its originating user story for independent validation
- Services layer (`backend/src/services/`) is **not touched** — workflow.ts and business rules are preserved verbatim
- The `backend/src/db/` directory (better-sqlite3 bootstrap) is deleted in T030 after Prisma replaces it
- All REST endpoints (`/api/*`) are fully removed; `/trpc` is the only API surface after T017 and T025–T026
- Integration tests (T032–T035) use a dedicated `test.db` file and `createCallerFactory` — no HTTP server is started
- Run `npx prisma generate` in backend/ if TypeScript reports missing @prisma/client types after any schema edit
