# Data Model: Court Reporting Workflow Manager

**Phase**: 1 | **Branch**: `001-court-reporting-workflow` | **Date**: 2026-05-31

---

## Entities

### Job

Central entity. One job = one transcription task for one court case.

| Field | Type (SQLite) | TypeScript Type | Constraints |
|---|---|---|---|
| `id` | `INTEGER` PK AUTOINCREMENT | `number` | system-generated |
| `case_name` | `TEXT NOT NULL` | `string` | non-empty; duplicates allowed (FR-001) |
| `duration_minutes` | `INTEGER NOT NULL` | `number` | > 0; validated at creation (edge case) |
| `location_type` | `TEXT NOT NULL` | `'physical' \| 'remote'` | enum; validated at creation |
| `city` | `TEXT` | `string \| null` | required when `location_type = 'physical'`; null otherwise (FR-001) |
| `status` | `TEXT NOT NULL DEFAULT 'NEW'` | `JobStatus` | controlled exclusively by workflow service |
| `reporter_id` | `INTEGER` FK → reporters | `number \| null` | set on ASSIGNED transition |
| `editor_id` | `INTEGER` FK → editors | `number \| null` | set on REVIEWED transition |
| `created_at` | `TEXT NOT NULL` | `string` (ISO 8601) | `DEFAULT CURRENT_TIMESTAMP` |
| `assigned_at` | `TEXT` | `string \| null` | set when status → ASSIGNED |
| `transcribed_at` | `TEXT` | `string \| null` | set when status → TRANSCRIBED |
| `reviewed_at` | `TEXT` | `string \| null` | set when status → REVIEWED |
| `completed_at` | `TEXT` | `string \| null` | set when status → COMPLETED |

**Validation rules**:
- `case_name` must be non-empty string (trimmed length > 0)
- `duration_minutes` must be a positive integer (≥ 1)
- `location_type` must be exactly `'physical'` or `'remote'`
- `city` must be a non-empty string when `location_type = 'physical'`; must be absent/null when `'remote'`
- `status` transitions enforced by workflow service only; direct updates prohibited

---

### Reporter

Pre-seeded; no create/edit/delete UI.

| Field | Type (SQLite) | TypeScript Type | Constraints |
|---|---|---|---|
| `id` | `INTEGER` PK AUTOINCREMENT | `number` | system-generated |
| `name` | `TEXT NOT NULL` | `string` | non-empty |
| `city` | `TEXT NOT NULL` | `string` | home city for location matching |
| `is_available` | `INTEGER NOT NULL DEFAULT 1` | `boolean` | SQLite: 1 = available, 0 = unavailable |
| `rate_per_minute` | `INTEGER NOT NULL DEFAULT 2000` | `number` | IDR per minute; positive integer |

**Seed data** (migration 002):

| name | city | is_available | rate_per_minute |
|---|---|---|---|
| Adi Santoso | Jakarta | 1 | 2000 |
| Budi Hartono | Jakarta | 1 | 2000 |
| Citra Dewi | Surabaya | 1 | 2000 |
| Dian Permata | Bandung | 0 | 2000 |

*Dian Permata is seeded as unavailable to demonstrate FR-006 (unavailable reporters excluded from
assignment list).*

---

### Editor

Pre-seeded; no create/edit/delete UI.

| Field | Type (SQLite) | TypeScript Type | Constraints |
|---|---|---|---|
| `id` | `INTEGER` PK AUTOINCREMENT | `number` | system-generated |
| `name` | `TEXT NOT NULL` | `string` | non-empty |
| `flat_fee` | `INTEGER NOT NULL DEFAULT 50000` | `number` | IDR per job; positive integer |

**Seed data** (migration 002):

| name | flat_fee |
|---|---|
| Eka Rahardjo | 50000 |
| Farah Yunita | 50000 |

---

## State Machine

All transitions enforced in `backend/src/services/workflow.ts`. No route or controller may write
`job.status` directly.

```
NEW ──(assign reporter)──► ASSIGNED ──(mark transcribed)──► TRANSCRIBED
                                                                  │
                                                         (assign editor)
                                                                  │
                                                                  ▼
                                                             REVIEWED ──(complete)──► COMPLETED
```

| From | To | Trigger | Side Effects |
|---|---|---|---|
| `NEW` | `ASSIGNED` | `POST /api/jobs/:id/assign-reporter` | Sets `reporter_id`, `assigned_at` |
| `ASSIGNED` | `TRANSCRIBED` | `POST /api/jobs/:id/mark-transcribed` | Sets `transcribed_at` |
| `TRANSCRIBED` | `REVIEWED` | `POST /api/jobs/:id/assign-editor` | Sets `editor_id`, `reviewed_at` |
| `REVIEWED` | `COMPLETED` | `POST /api/jobs/:id/complete` | Sets `completed_at` |

Any transition not in the above table is rejected with HTTP 409 and a descriptive error message
(SC-004).

---

## Relationships

```
reporters ─────────────────┐
                           │ reporter_id (nullable FK)
jobs ──────────────────────┤
                           │ editor_id (nullable FK)
editors ───────────────────┘
```

- A job has at most one reporter and at most one editor.
- Reporter and editor assignments are write-once for this scope (re-assignment is out of scope).
- No separate `assignments` junction table is needed — the FK columns on `jobs` are sufficient.

---

## TypeScript Types (shared.ts)

```typescript
export type JobStatus = 'NEW' | 'ASSIGNED' | 'TRANSCRIBED' | 'REVIEWED' | 'COMPLETED';
export type LocationType = 'physical' | 'remote';

export interface Reporter {
  id: number;
  name: string;
  city: string;
  is_available: boolean;
  rate_per_minute: number;
}

export interface Editor {
  id: number;
  name: string;
  flat_fee: number;
}

export interface Job {
  id: number;
  case_name: string;
  duration_minutes: number;
  location_type: LocationType;
  city: string | null;
  status: JobStatus;
  reporter_id: number | null;
  editor_id: number | null;
  created_at: string;
  assigned_at: string | null;
  transcribed_at: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
}

// Enriched view returned by GET /api/jobs
export interface JobListItem extends Job {
  reporter_name: string | null;
  reporter_pay: number;           // 0 if no reporter assigned
  editor_name: string | null;
  editor_pay: number;             // 0 if no editor assigned
}

// Request bodies
export interface CreateJobRequest {
  case_name: string;
  duration_minutes: number;
  location_type: LocationType;
  city?: string;                  // required when location_type = 'physical'
}

export interface AssignReporterRequest {
  reporter_id: number;
}

export interface AssignEditorRequest {
  editor_id: number;
}
```

---

## SQL DDL (migration 001_init.sql)

```sql
CREATE TABLE IF NOT EXISTS reporters (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  city             TEXT    NOT NULL,
  is_available     INTEGER NOT NULL DEFAULT 1,
  rate_per_minute  INTEGER NOT NULL DEFAULT 2000
);

CREATE TABLE IF NOT EXISTS editors (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT    NOT NULL,
  flat_fee INTEGER NOT NULL DEFAULT 50000
);

CREATE TABLE IF NOT EXISTS jobs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  case_name        TEXT    NOT NULL,
  duration_minutes INTEGER NOT NULL,
  location_type    TEXT    NOT NULL,
  city             TEXT,
  status           TEXT    NOT NULL DEFAULT 'NEW',
  reporter_id      INTEGER REFERENCES reporters(id),
  editor_id        INTEGER REFERENCES editors(id),
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  assigned_at      TEXT,
  transcribed_at   TEXT,
  reviewed_at      TEXT,
  completed_at     TEXT
);
```
