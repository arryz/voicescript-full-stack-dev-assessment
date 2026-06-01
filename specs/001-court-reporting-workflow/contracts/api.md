# API Contract: Court Reporting Workflow Manager

**Phase**: 1 | **Branch**: `001-court-reporting-workflow` | **Date**: 2026-05-31

Base URL (development): `http://localhost:3001`
Frontend proxy: Vite proxies `/api/*` → `http://localhost:3001` during dev.

All requests and responses use `Content-Type: application/json`.
Error responses always include a `message` field describing what went wrong.

---

## Error Response Shape

```typescript
interface ErrorResponse {
  message: string;
}
```

Common HTTP status codes:
- `400 Bad Request` — validation failed (missing field, invalid value)
- `404 Not Found` — resource does not exist
- `409 Conflict` — invalid workflow transition or duplicate constraint
- `500 Internal Server Error` — unexpected server error

---

## Jobs

### GET /api/jobs

List all jobs, enriched with reporter name, editor name, and payment totals. Ordered by
`created_at DESC` (newest first). No pagination.

**Response `200 OK`**:

```typescript
type Response = JobListItem[];

interface JobListItem {
  id: number;
  case_name: string;
  duration_minutes: number;
  location_type: 'physical' | 'remote';
  city: string | null;
  status: 'NEW' | 'ASSIGNED' | 'TRANSCRIBED' | 'REVIEWED' | 'COMPLETED';
  reporter_id: number | null;
  reporter_name: string | null;
  reporter_pay: number;         // duration_minutes × rate_per_minute; 0 if no reporter
  editor_id: number | null;
  editor_name: string | null;
  editor_pay: number;           // flat_fee; 0 if no editor
  created_at: string;           // ISO 8601
  assigned_at: string | null;
  transcribed_at: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
}
```

---

### POST /api/jobs

Create a new job. Status is always set to `NEW` by the server.

**Request body**:

```typescript
interface CreateJobRequest {
  case_name: string;          // non-empty after trim
  duration_minutes: number;   // positive integer ≥ 1
  location_type: 'physical' | 'remote';
  city?: string;              // required when location_type = 'physical'; omit for remote
}
```

**Response `201 Created`**: The created `JobListItem` (with `reporter_pay: 0`, `editor_pay: 0`).

**Error `400`**: Missing required field, `duration_minutes` ≤ 0, or `city` absent for a physical
job.

---

### POST /api/jobs/:id/assign-reporter

Assign an available reporter to a job in `NEW` status. Advances status to `ASSIGNED`.

**Request body**:

```typescript
interface AssignReporterRequest {
  reporter_id: number;
}
```

**Response `200 OK`**: Updated `JobListItem`.

**Error `400`**: `reporter_id` missing or not a positive integer.
**Error `404`**: Job or reporter not found.
**Error `409`**: Job is not in `NEW` status, or reporter is unavailable.

---

### POST /api/jobs/:id/mark-transcribed

Advance a job from `ASSIGNED` to `TRANSCRIBED`. No request body required.

**Request body**: empty / `{}`

**Response `200 OK`**: Updated `JobListItem`.

**Error `404`**: Job not found.
**Error `409`**: Job is not in `ASSIGNED` status.

---

### POST /api/jobs/:id/assign-editor

Assign an editor to a job in `TRANSCRIBED` status. Advances status to `REVIEWED`.

**Request body**:

```typescript
interface AssignEditorRequest {
  editor_id: number;
}
```

**Response `200 OK`**: Updated `JobListItem`.

**Error `400`**: `editor_id` missing or not a positive integer.
**Error `404`**: Job or editor not found.
**Error `409`**: Job is not in `TRANSCRIBED` status.

---

### POST /api/jobs/:id/complete

Advance a job from `REVIEWED` to `COMPLETED`. No request body required.

**Request body**: empty / `{}`

**Response `200 OK`**: Updated `JobListItem`.

**Error `404`**: Job not found.
**Error `409`**: Job is not in `REVIEWED` status.

---

## Reporters

### GET /api/reporters

List all available reporters (`is_available = true`), optionally sorted for a specific job.

**Query parameters**:

| Param | Type | Description |
|---|---|---|
| `jobCity` | `string` (optional) | When provided, same-city reporters appear first (FR-005) |

**Response `200 OK`**:

```typescript
type Response = Reporter[];

interface Reporter {
  id: number;
  name: string;
  city: string;
  is_available: boolean;
  rate_per_minute: number;
}
```

Ordering: when `jobCity` is supplied, rows where `city = jobCity` sort before others; ties broken
by `name ASC`. When `jobCity` is absent, ordered by `name ASC`.

---

## Editors

### GET /api/editors

List all editors (no availability filter — editors have no availability concept in the spec).

**Response `200 OK`**:

```typescript
type Response = Editor[];

interface Editor {
  id: number;
  name: string;
  flat_fee: number;
}
```

Ordered by `name ASC`.

---

## Workflow Transition Summary

| Action | Endpoint | Required current status | Resulting status |
|---|---|---|---|
| Assign reporter | `POST /api/jobs/:id/assign-reporter` | `NEW` | `ASSIGNED` |
| Mark transcribed | `POST /api/jobs/:id/mark-transcribed` | `ASSIGNED` | `TRANSCRIBED` |
| Assign editor | `POST /api/jobs/:id/assign-editor` | `TRANSCRIBED` | `REVIEWED` |
| Complete | `POST /api/jobs/:id/complete` | `REVIEWED` | `COMPLETED` |
