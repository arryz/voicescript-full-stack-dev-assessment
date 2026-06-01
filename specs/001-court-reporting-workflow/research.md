# Research: Court Reporting Workflow Manager

**Phase**: 0 | **Branch**: `001-court-reporting-workflow` | **Date**: 2026-05-31 | **Updated**: 2026-05-31

## 1. State Machine Pattern

**Decision**: Transition table — a plain TypeScript `Record<JobStatus, JobStatus | null>` object
in `backend/src/services/workflow.ts`. An `assertValidTransition(from, to)` function reads the
table and throws a typed `WorkflowError` on any invalid move.

**Rationale**: Five statuses, one linear path. No branching, no guards beyond the linear sequence,
no persistence of transition history (timestamps are sufficient per spec). A class-based or library
state machine would add overhead with no benefit at this scale. The transition table is immediately
readable by an evaluator scanning the service layer.

**Alternatives considered**:
- XState / statecharts library — rejected: adds a large dependency and indirection not justified
  for a 5-state linear machine.
- Switch/case in controller — rejected: violates Principle IV (no business logic in controllers).
- Status written directly from route handler — rejected: explicitly prohibited by Principle II.

**Implementation sketch**:

```typescript
type JobStatus = 'NEW' | 'ASSIGNED' | 'TRANSCRIBED' | 'REVIEWED' | 'COMPLETED';

const VALID_TRANSITIONS: Record<JobStatus, JobStatus | null> = {
  NEW:         'ASSIGNED',
  ASSIGNED:    'TRANSCRIBED',
  TRANSCRIBED: 'REVIEWED',
  REVIEWED:    'COMPLETED',
  COMPLETED:   null,
};

function assertValidTransition(from: JobStatus, to: JobStatus): void {
  if (VALID_TRANSITIONS[from] !== to) {
    throw new WorkflowError(`Cannot transition from ${from} to ${to}`);
  }
}
```

The service layer calls `assertValidTransition` before every status write. Controllers catch
`WorkflowError` and return HTTP 409 Conflict with the error message.

---

## 2. SQLite Migration Pattern (better-sqlite3)

**Decision**: Use SQLite's built-in `PRAGMA user_version` as a migration version counter.
On server startup, the DB module reads the current `user_version`, then runs all `.sql` files
in `src/db/migrations/` whose sequence number exceeds the current version, in ascending order.
After each file runs, `PRAGMA user_version` is incremented.

**Rationale**: Zero external dependencies; built into SQLite; deterministic; easy to audit. Works
correctly even when the database file already exists from a previous run.

**Alternatives considered**:
- `db-migrate` / `knex migrations` — rejected: pulls in additional deps; more ceremony than the
  assessment warrants.
- Run migrations only once at DB creation — rejected: brittle across re-runs; doesn't handle
  future schema additions cleanly.

**Implementation sketch**:

```typescript
function runMigrations(db: Database): void {
  const currentVersion = (db.pragma('user_version', { simple: true }) as number);
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const seqStr = file.split('_')[0];
    const seq = parseInt(seqStr, 10);
    if (seq <= currentVersion) { continue; }
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    db.exec(sql);
    db.pragma(`user_version = ${seq}`);
  }
}
```

Migration files: `001_init.sql` (DDL), `002_seed.sql` (reporter + editor seed data).

---

## 3. Type Sharing Strategy

**Decision**: Define all shared interfaces in `backend/src/types/shared.ts`. Manually mirror the
same file to `frontend/src/types/api.ts`. No monorepo workspace or symlink required.

**Rationale**: An assessment codebase has a fixed, small set of types. The duplication cost (two
files to update on type change) is negligible vs. the setup cost of configuring a `shared/` package
with workspace resolution in both tsconfig files. The evaluator can see both files and confirm
they're consistent.

**Alternatives considered**:
- `shared/` npm workspace package — rejected: adds `pnpm workspaces` or `yarn workspaces` config;
  both tsconfig files need `paths` aliases; not worth it for ~5 interfaces.
- Fetch types from backend at build time — rejected: over-engineered.

**Mirror list** (interfaces defined in `backend/src/types/shared.ts` and copied to
`frontend/src/types/api.ts`): `JobStatus`, `Job`, `Reporter`, `Editor`, `CreateJobRequest`,
`AssignReporterRequest`, `AssignEditorRequest`, `JobListItem` (enriched view with payment fields).

---

## 4. Reporter Assignment Ordering

**Decision**: The data-access query for available reporters accepts an optional `jobCity` parameter.
When provided, rows are ordered by `CASE WHEN city = ? THEN 0 ELSE 1 END, name ASC`. When omitted
(remote jobs), order is `name ASC`.

**Rationale**: Sorting happens in SQL, not in application code, keeping the data-access layer
authoritative for all data-shaping. The service layer passes `jobCity` when the job is physical
and null when remote.

**Implementation sketch** (data-access):

```typescript
function listAvailableReporters(jobCity: string | null): Reporter[] {
  if (jobCity !== null) {
    return db.prepare(`
      SELECT * FROM reporters
      WHERE is_available = 1
      ORDER BY CASE WHEN city = ? THEN 0 ELSE 1 END, name ASC
    `).all(jobCity) as Reporter[];
  }
  return db.prepare(`
    SELECT * FROM reporters WHERE is_available = 1 ORDER BY name ASC
  `).all() as Reporter[];
}
```

---

## 5. Vite Dev Proxy

**Decision**: Configure `vite.config.ts` to proxy `/api` requests to `http://localhost:3001`
during development.

**Rationale**: Eliminates CORS configuration on the backend during development. Frontend fetch
calls use `/api/...` paths that work unchanged in both dev (proxied) and any future production
deployment where both are served from the same origin.

**Configuration**:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

---

## 6. Payment Calculation

**Decision**: Payment is calculated on-the-fly in the data-access read query for jobs (or in the
service layer enrichment step), not stored in the database.

**Rationale**: Reporter pay = `duration_minutes × rate_per_minute`; editor pay = `flat_fee`. Both
inputs are already in the DB; storing the calculated result would duplicate data and risk
inconsistency if rates change. Display-only calculation is correct per spec.

**SQL approach** (calculate in query for efficiency):

```sql
SELECT
  j.*,
  r.name AS reporter_name,
  r.rate_per_minute,
  e.name AS editor_name,
  e.flat_fee,
  COALESCE(j.duration_minutes * r.rate_per_minute, 0) AS reporter_pay,
  COALESCE(e.flat_fee, 0) AS editor_pay
FROM jobs j
LEFT JOIN reporters r ON j.reporter_id = r.id
LEFT JOIN editors e ON j.editor_id = e.id
ORDER BY j.created_at DESC
```

`COALESCE` handles the case where no reporter or editor is assigned, returning 0 as specified.

---

## 7. Tailwind CSS Setup (Vite + React)

**Decision**: Use Tailwind CSS v3 with the official `@tailwindcss/vite` (Vite plugin) integration.
Add `@tailwind` directives to a single `src/index.css` imported in `main.tsx`. Configure content
paths in `tailwind.config.ts` to cover all `src/**/*.{ts,tsx}` files.

**Rationale**: Tailwind v3 with the Vite plugin requires zero PostCSS config — the plugin handles
purging and compilation automatically. Utility-first classes keep component files self-contained
(no separate `.module.css` files), which suits the single-screen dashboard layout well. The
evaluator can read styling intent directly from JSX without cross-referencing stylesheet files.

**Alternatives considered**:
- CSS Modules — rejected: verbose for a single-screen dashboard; no scoping benefit at this scale.
- Styled-components / Emotion — rejected: adds runtime overhead and a large dependency with no
  benefit for an assessment.
- Plain CSS — rejected: harder to maintain consistency; Tailwind's utility classes communicate
  design intent more directly.

**Setup steps** (captured in quickstart.md):

```bash
npm install -D tailwindcss @tailwindcss/vite
npx tailwindcss init --ts   # generates tailwind.config.ts
```

**tailwind.config.ts**:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

**vite.config.ts** (updated — plugin replaces PostCSS):

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
});
```

**src/index.css** (directives only):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
