# Tasks: Court Reporting Workflow Manager

**Input**: Design documents from `/specs/001-court-reporting-workflow/`
**Branch**: `001-court-reporting-workflow` | **Generated**: 2026-05-31

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Tests are not included (not required per plan.md).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no sequential dependency)
- **[Story]**: Which user story this task belongs to (US1–US4)
- No story label on Setup or Foundational phase tasks

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both packages, install dependencies, and configure TypeScript + build tooling.

- [X] T001 Initialize backend/package.json with dependencies: express@4, better-sqlite3, cors; devDependencies: typescript, ts-node-dev, @types/express, @types/node, @types/better-sqlite3, @types/cors; add scripts: `dev` (ts-node-dev src/index.ts), `build` (tsc), `start` (node dist/index.js); run `npm install` in backend/
- [X] T002 Initialize frontend/package.json with dependencies: react@18, react-dom@18; devDependencies: vite, @vitejs/plugin-react, tailwindcss, @tailwindcss/vite, typescript, @types/react, @types/react-dom; add scripts: `dev` (vite), `build` (tsc && vite build), `preview` (vite preview), `type-check` (tsc --noEmit); run `npm install` in frontend/
- [X] T003 [P] Write backend/tsconfig.json with compilerOptions: strict true, target ES2020, module commonjs, outDir dist, rootDir src, esModuleInterop true, skipLibCheck true
- [X] T004 [P] Write frontend/tsconfig.json with strict true, target ES2020, module ESNext, jsx react-jsx; write frontend/vite.config.ts using react() and tailwindcss() plugins with server.proxy `/api` → `http://localhost:3001`; write frontend/tailwind.config.ts with content paths `./index.html` and `./src/**/*.{ts,tsx}`; write frontend/src/index.css with `@tailwind base`, `@tailwind components`, `@tailwind utilities` directives

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that must be complete before any user story can be implemented — shared types, database layer, workflow state machine, and Express server scaffolding.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Create backend/src/types/shared.ts exporting: `JobStatus` (`'NEW' | 'ASSIGNED' | 'TRANSCRIBED' | 'REVIEWED' | 'COMPLETED'`), `LocationType` (`'physical' | 'remote'`), and interfaces `Reporter`, `Editor`, `Job`, `JobListItem` (extends Job with `reporter_name`, `reporter_pay`, `editor_name`, `editor_pay`), `CreateJobRequest`, `AssignReporterRequest`, `AssignEditorRequest` — exact shapes from data-model.md
- [X] T006 [P] Create frontend/src/types/api.ts as an exact mirror of backend/src/types/shared.ts — same exports, same field names and types
- [X] T007 Create backend/src/db/migrations/001_init.sql with `CREATE TABLE IF NOT EXISTS` DDL for `reporters` (id, name, city, is_available INTEGER DEFAULT 1, rate_per_minute INTEGER DEFAULT 2000), `editors` (id, name, flat_fee INTEGER DEFAULT 50000), and `jobs` (id, case_name, duration_minutes, location_type, city, status TEXT DEFAULT 'NEW', reporter_id FK→reporters, editor_id FK→editors, created_at DEFAULT datetime('now'), assigned_at, transcribed_at, reviewed_at, completed_at) — exact DDL from data-model.md
- [X] T008 [P] Create backend/src/db/migrations/002_seed.sql with INSERT statements for reporters: Adi Santoso/Jakarta/available/2000, Budi Hartono/Jakarta/available/2000, Citra Dewi/Surabaya/available/2000, Dian Permata/Bandung/unavailable(0)/2000; and editors: Eka Rahardjo/50000, Farah Yunita/50000
- [X] T009 Create backend/src/db/index.ts exporting a `db` singleton (better-sqlite3 Database opening `data/court_reporting.db`, creating `data/` dir if absent) and a `runMigrations(db)` function that reads `PRAGMA user_version`, sorts `.sql` files in `src/db/migrations/` by sequence prefix, runs each file whose sequence > current version with `db.exec()`, and increments `PRAGMA user_version` after each; call `runMigrations` at module load
- [X] T010 Create backend/src/services/workflow.ts exporting `VALID_TRANSITIONS: Record<JobStatus, JobStatus | null>` mapping `NEW→ASSIGNED`, `ASSIGNED→TRANSCRIBED`, `TRANSCRIBED→REVIEWED`, `REVIEWED→COMPLETED`, `COMPLETED→null`; export `class WorkflowError extends Error`; export `assertValidTransition(from: JobStatus, to: JobStatus): void` throwing `WorkflowError` with descriptive message when `VALID_TRANSITIONS[from] !== to`
- [X] T011 Create backend/src/index.ts as Express server entry point: import `db` from `./db/index` (triggers migrations), configure `express.json()` and `cors()` middleware, add a global error handler that returns `WorkflowError` as HTTP 409 and validation errors as HTTP 400, listen on `PORT` env var or 3001; leave a `// routes mounted here` comment block where route modules will be added — route mounting is done by each route task (T015, T026, T037) as those files are created

**Checkpoint**: DB migrates cleanly on `npm run dev` in backend/; `PRAGMA user_version` is 2 after startup.

---

## Phase 3: User Story 1 — Create and Track Jobs (Priority: P1) 🎯 MVP

**Goal**: Staff can create a job with case name, duration, location type, and city; job appears on the dashboard with status NEW and correct details.

**Independent Test**: Start backend and frontend, create a job with case "Smith v. Jones", 90 min, physical, Jakarta — confirm it appears in the job list with status NEW, correct case name, duration, and location type. No reporters or editors needed.

### Implementation

- [X] T012 [US1] Create backend/src/data-access/jobs.ts with `createJob(data: CreateJobRequest): Job` (INSERT returning the new row), `listJobs(): JobListItem[]` (SELECT j.*, r.name AS reporter_name, COALESCE(j.duration_minutes * r.rate_per_minute, 0) AS reporter_pay, e.name AS editor_name, COALESCE(e.flat_fee, 0) AS editor_pay FROM jobs j LEFT JOIN reporters r ON j.reporter_id = r.id LEFT JOIN editors e ON j.editor_id = e.id ORDER BY j.created_at DESC), `getJobById(id: number): Job | undefined` (SELECT * FROM jobs WHERE id = ?), and `listJobById(id: number): JobListItem | undefined` (same JOIN query as listJobs but with WHERE j.id = ? LIMIT 1) — the latter two are required by the service layer update operations in T027 and T038
- [X] T013 [US1] Create backend/src/services/jobs.ts with `createJob(data: CreateJobRequest): Job` validating: case_name non-empty after trim (400 if not), duration_minutes is integer ≥ 1 (400 if not), location_type is 'physical' or 'remote' (400 if not), city non-empty string required when physical (400 if absent); call data-access createJob on success
- [X] T014 [US1] Create backend/src/controllers/jobs.ts with `handleListJobs(req, res, next)` calling `jobsDataAccess.listJobs()` and responding 200 with array; and `handleCreateJob(req, res, next)` calling `jobsService.createJob(req.body)` and responding 201 with created JobListItem; pass errors to `next`
- [X] T015 [US1] Create backend/src/routes/jobs.ts exporting an Express Router with `GET /` → handleListJobs and `POST /` → handleCreateJob; import and mount this router in backend/src/index.ts at `/api/jobs`
- [X] T016 [P] [US1] Create frontend/src/services/api.ts with `fetchJobs(): Promise<JobListItem[]>` calling `GET /api/jobs` and `createJob(data: CreateJobRequest): Promise<JobListItem>` calling `POST /api/jobs`; both throw on non-2xx responses including the server's `message` field
- [X] T017 [P] [US1] Create frontend/src/components/CreateJobForm.tsx as a controlled form component with inputs for case_name (text), duration_minutes (number), location_type (select or radio: physical/remote), city (text input shown only when location_type='physical'); on submit call `api.createJob` and call an `onCreated` prop callback on success; show field-level errors from the API response
- [X] T018 [US1] Create frontend/src/hooks/useDashboard.ts exporting `useDashboard()` returning `{ jobs: JobListItem[], refresh: () => void, loading: boolean, error: string | null }`; fetch jobs via `api.fetchJobs()` in a useEffect on mount and whenever `refresh()` is called
- [X] T019 [US1] Create frontend/src/components/JobRow.tsx accepting a `job: JobListItem` prop and rendering a `<tr>` with cells for: case_name, duration_minutes (e.g. "90 min"), location_type + city (e.g. "Physical — Jakarta"), status (styled badge); leave action cells empty for now
- [X] T020 [US1] Create frontend/src/components/JobTable.tsx accepting `jobs: JobListItem[]` and rendering a Tailwind-styled `<table>` with `<thead>` columns (Case, Duration, Location, Status) and a JobRow per job; show "No jobs yet" when array is empty
- [X] T021 [US1] Create frontend/src/components/Dashboard.tsx as the root single-screen layout: import `useDashboard`, render CreateJobForm at the top passing a `onCreated` callback that calls `refresh()`, then render JobTable with the jobs array; wrap in a Tailwind max-width container
- [X] T022 [US1] Create frontend/index.html as minimal HTML with `<div id="root">` and `<script type="module" src="/src/main.tsx">`; create frontend/src/main.tsx mounting `<Dashboard />` into `#root` with `ReactDOM.createRoot`

**Checkpoint**: US1 complete — start backend (`npm run dev` in backend/) and frontend (`npm run dev` in frontend/); open http://localhost:5173, create a job, confirm it appears in the table with status NEW.

---

## Phase 4: User Story 2 — Assign a Reporter to a Job (Priority: P2)

**Goal**: Staff assigns an available reporter to a NEW job, same-city reporters surface first for physical jobs, job status advances to ASSIGNED; staff can then mark the job as TRANSCRIBED.

**Independent Test**: Create a physical Jakarta job, open assignment modal, confirm Jakarta reporters appear before Surabaya reporter, assign Adi Santoso, confirm status=ASSIGNED. Then click "Mark Transcribed" and confirm status=TRANSCRIBED.

### Implementation

- [X] T023 [US2] Create backend/src/data-access/reporters.ts with `listAvailableReporters(jobCity: string | null): Reporter[]`; when jobCity is provided use `ORDER BY CASE WHEN city = ? THEN 0 ELSE 1 END, name ASC`; when null use `ORDER BY name ASC`; always filter `WHERE is_available = 1`
- [X] T024 [US2] Create backend/src/services/reporters.ts with `getAvailableReporters(jobCity: string | null): Reporter[]` calling the data-access function
- [X] T025 [US2] Create backend/src/controllers/reporters.ts with `handleListReporters(req, res, next)` reading optional `?jobCity` query param, calling `reportersService.getAvailableReporters(jobCity ?? null)`, responding 200 with the reporter array
- [X] T026 [US2] Create backend/src/routes/reporters.ts exporting an Express Router with `GET /` → handleListReporters; import and mount in backend/src/index.ts at `/api/reporters`
- [X] T027 [US2] Add `assignReporter(jobId: number, reporterId: number): JobListItem` to backend/src/services/jobs.ts: fetch job by id (404 if absent), call `assertValidTransition(job.status, 'ASSIGNED')` (throws WorkflowError on wrong status), fetch reporter (404 if absent), check `reporter.is_available` (409 if not), update job row setting reporter_id, status='ASSIGNED', assigned_at=datetime('now'); return updated JobListItem via `listJobById`; add `markTranscribed(jobId: number): JobListItem` that fetches job, calls `assertValidTransition(job.status, 'TRANSCRIBED')`, updates status and transcribed_at
- [X] T028 [US2] Add `handleAssignReporter(req, res, next)` and `handleMarkTranscribed(req, res, next)` to backend/src/controllers/jobs.ts; both call the corresponding service functions, respond 200 with updated JobListItem, pass errors to `next`
- [X] T029 [US2] Add `POST /:id/assign-reporter` → handleAssignReporter and `POST /:id/mark-transcribed` → handleMarkTranscribed to backend/src/routes/jobs.ts
- [X] T030 [P] [US2] Add `fetchReporters(jobCity?: string): Promise<Reporter[]>`, `assignReporter(jobId: number, body: AssignReporterRequest): Promise<JobListItem>`, and `markTranscribed(jobId: number): Promise<JobListItem>` to frontend/src/services/api.ts
- [X] T031 [US2] Create frontend/src/hooks/useAssignment.ts exporting `useAssignment()` returning `{ modalOpen: boolean, selectedJob: JobListItem | null, openModal: (job: JobListItem) => void, closeModal: () => void, onAssigned: () => void }`; `onAssigned` closes the modal and calls a `refresh` callback passed to the hook
- [X] T032 [US2] Create frontend/src/components/AssignModal.tsx accepting `job: JobListItem`, `onClose: () => void`, `onAssigned: () => void`; fetch reporters via `api.fetchReporters(job.city ?? undefined)` on mount; render reporter list showing name and city; highlight same-city rows; on selection call `api.assignReporter` and invoke `onAssigned`
- [X] T033 [US2] Update frontend/src/components/JobRow.tsx: add an action cell — when status=NEW render "Assign Reporter" button that calls `onOpenAssign(job)` prop; when status=ASSIGNED render "Mark Transcribed" button that calls `api.markTranscribed(job.id)` then triggers dashboard refresh via `onRefresh` prop; update JobTable.tsx and Dashboard.tsx to pass these props and wire useAssignment

**Checkpoint**: US2 complete — create job, assign Jakarta reporter (confirm same-city first in modal list), status=ASSIGNED; click "Mark Transcribed", status=TRANSCRIBED.

---

## Phase 5: User Story 3 — Assign an Editor for Review (Priority: P3)

**Goal**: Staff assigns an editor to a TRANSCRIBED job, advancing it to REVIEWED; staff can then mark REVIEWED jobs as COMPLETED.

**Independent Test**: Walk through: create job → assign reporter (ASSIGNED) → mark transcribed (TRANSCRIBED) → assign editor (REVIEWED) → complete (COMPLETED). Verify each status transition and that attempting to assign an editor to a non-TRANSCRIBED job returns an error.

### Implementation

- [X] T034 [US3] Create backend/src/data-access/editors.ts with `listEditors(): Editor[]` returning all editors `ORDER BY name ASC`
- [X] T035 [US3] Create backend/src/services/editors.ts with `getEditors(): Editor[]` calling the data-access function
- [X] T036 [US3] Create backend/src/controllers/editors.ts with `handleListEditors(req, res, next)` calling `editorsService.getEditors()` and responding 200 with the editor array
- [X] T037 [US3] Create backend/src/routes/editors.ts exporting an Express Router with `GET /` → handleListEditors; import and mount in backend/src/index.ts at `/api/editors`
- [X] T038 [US3] Add `assignEditor(jobId: number, editorId: number): JobListItem` to backend/src/services/jobs.ts: fetch job (404 if absent), call `assertValidTransition(job.status, 'REVIEWED')`, fetch editor (404 if absent), update job setting editor_id, status='REVIEWED', reviewed_at=datetime('now'); return updated JobListItem; add `completeJob(jobId: number): JobListItem` that fetches job, calls `assertValidTransition(job.status, 'COMPLETED')`, updates status and completed_at
- [X] T039 [US3] Add `handleAssignEditor(req, res, next)` and `handleCompleteJob(req, res, next)` to backend/src/controllers/jobs.ts; both respond 200 with updated JobListItem
- [X] T040 [US3] Add `POST /:id/assign-editor` → handleAssignEditor and `POST /:id/complete` → handleCompleteJob to backend/src/routes/jobs.ts
- [X] T041 [P] [US3] Add `fetchEditors(): Promise<Editor[]>`, `assignEditor(jobId: number, body: AssignEditorRequest): Promise<JobListItem>`, and `completeJob(jobId: number): Promise<JobListItem>` to frontend/src/services/api.ts
- [X] T042 [US3] Update frontend/src/hooks/useAssignment.ts to accept a `mode: 'reporter' | 'editor'` concept — add `openEditorModal(job: JobListItem)` so Dashboard can open the modal in editor mode for TRANSCRIBED jobs
- [X] T043 [US3] Update frontend/src/components/AssignModal.tsx to accept a `mode: 'reporter' | 'editor'` prop; when mode='editor' fetch editors via `api.fetchEditors()` instead, render editor list (name only), on selection call `api.assignEditor` and invoke `onAssigned`; also update the `<AssignModal>` usage introduced in T033 (inside JobRow) to explicitly pass `mode='reporter'` so the existing reporter assignment flow compiles cleanly after the prop is added
- [X] T044 [US3] Update frontend/src/components/JobRow.tsx: add "Assign Editor" button when status=TRANSCRIBED (calls `onOpenEditorAssign(job)` prop); add "Complete" button when status=REVIEWED (calls `api.completeJob(job.id)` then `onRefresh`); update Dashboard.tsx to wire `onOpenEditorAssign` through useAssignment

**Checkpoint**: US3 complete — full end-to-end workflow reaches COMPLETED; invalid transitions (e.g. assigning editor to a NEW job) return 409 with a descriptive message.

---

## Phase 6: User Story 4 — View Payment Calculations (Priority: P4)

**Goal**: Staff sees reporter pay (duration × per-minute rate) and editor pay (flat fee) displayed inline on the dashboard for every job.

**Independent Test**: With a COMPLETED job (90 min, Adi Santoso at 2000 IDR/min, Eka Rahardjo at 50000 IDR flat fee), confirm the dashboard shows 180,000 IDR reporter pay and 50,000 IDR editor pay. Verify a NEW job with no assignments shows 0 or "—" for both.

### Implementation

- [X] T045 [P] [US4] Update frontend/src/components/JobRow.tsx to add two cells displaying `reporter_pay` formatted as `{value.toLocaleString()} IDR` (or `—` when 0) and `editor_pay` formatted the same way
- [X] T046 [P] [US4] Update frontend/src/components/JobTable.tsx to add "Reporter Pay" and "Editor Pay" column headers to `<thead>`

**Checkpoint**: US4 complete — payment columns visible on dashboard; 90-min job with both assignments shows 180,000 IDR / 50,000 IDR.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Type-safety validation and end-to-end smoke test against quickstart.md.

- [X] T047 [P] Run `npm run type-check` in frontend/ (tsc --noEmit) and resolve all TypeScript errors; ensure no implicit `any` or missing interface properties
- [X] T048 [P] Run `tsc --noEmit` in backend/ and resolve all TypeScript errors; confirm strict mode violations are zero
- [X] T049 Validate against quickstart.md: start backend (`cd backend && npm run dev`), confirm migration runner logs and server listens on 3001; start frontend (`cd frontend && npm run dev`), open http://localhost:5173; run the three `curl` smoke tests from quickstart.md (list jobs, create Smith v. Jones job, list reporters with jobCity=Jakarta); confirm Jakarta reporters sort before Surabaya reporter in the response

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Foundational — delivers MVP
- **US2 (Phase 4)**: Depends on US1 being complete (needs jobs, dashboard, and JobRow to exist)
- **US3 (Phase 5)**: Depends on US2 (needs TRANSCRIBED status reachable via Mark Transcribed)
- **US4 (Phase 6)**: Depends on US1 data layer (payment fields already in GET /api/jobs response); display tasks are independent of US2/US3 but most meaningful once those exist
- **Polish (Phase 7)**: Depends on all user story phases being complete

### Within Each User Story

- Backend data-access → service → controller → route (sequential)
- Frontend api.ts additions can be written [P] with component scaffolding
- Component files within a story that target different files can be written in parallel

### Parallel Opportunities

- T003 and T004 (config files) can run in parallel
- T005 and T006 (shared types) can run in parallel after T003/T004
- T007 and T008 (migration files) can run in parallel
- Within US1: T016 (api.ts) and T017 (CreateJobForm) can start in parallel after T005/T006
- Within US2: T023–T026 (reporters backend) can run in parallel with T030 (frontend api additions)
- Within US3: T034–T037 (editors backend) can run in parallel with T041 (frontend api additions)
- T045 and T046 (US4 display tasks) can run in parallel
- T047 and T048 (type checks) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch in parallel once Foundational is complete:
Task T016: Create frontend/src/services/api.ts (fetchJobs + createJob)
Task T017: Create frontend/src/components/CreateJobForm.tsx

# Then in parallel:
Task T018: Create frontend/src/hooks/useDashboard.ts
Task T019: Create frontend/src/components/JobRow.tsx

# Sequential after T019:
Task T020: Create frontend/src/components/JobTable.tsx

# Sequential after T016, T018, T020:
Task T021: Create frontend/src/components/Dashboard.tsx
Task T022: Create frontend/src/main.tsx + index.html
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Create a job on the dashboard, confirm it appears with status NEW
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. US1 → job creation and dashboard working (**MVP**)
3. US2 → reporter assignment and mark-transcribed working
4. US3 → editor assignment and job completion working
5. US4 → payment display added
6. Polish → types verified, quickstart validated

Each story adds value without breaking previous stories.

---

## Notes

- `[P]` = different files, no blocking dependency — safe to run in parallel
- `[USn]` maps the task to a specific user story for traceability and independent testing
- No test tasks generated — testing is not required per plan.md
- Payment calculation lives in the SQL query (`listJobs` data-access) from day 1; US4 is purely a frontend display concern
- WorkflowError (thrown by `assertValidTransition`) must be caught by the global Express error handler and returned as HTTP 409 — this is wired in T011 and used by every transition endpoint
- The `better-sqlite3` db singleton and migration runner (T009) must be imported before any route module uses `db` — the import in backend/src/index.ts (T011) ensures this
