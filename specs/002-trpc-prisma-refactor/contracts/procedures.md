# tRPC Procedure Catalogue

All procedures are exposed via Express middleware mounted at `/trpc`.
The frontend calls them through the tRPC React client using `trpc.<router>.<procedure>.useQuery()` or `.useMutation()`.

---

## jobs router

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `jobs.list` | query | — | `JobListItem[]` |
| `jobs.create` | mutation | `{ case_name: string; duration_minutes: number; location_type: 'physical' \| 'remote'; city?: string }` | `JobListItem` |
| `jobs.assignReporter` | mutation | `{ id: number; reporter_id: number }` | `JobListItem` |
| `jobs.markTranscribed` | mutation | `{ id: number }` | `JobListItem` |
| `jobs.assignEditor` | mutation | `{ id: number; editor_id: number }` | `JobListItem` |
| `jobs.complete` | mutation | `{ id: number }` | `JobListItem` |

## reporters router

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `reporters.list` | query | `{ jobCity?: string }` | `Reporter[]` |

## editors router

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `editors.list` | query | — | `Editor[]` |

---

## Error Handling

Domain errors thrown in services are caught in tRPC procedures and re-thrown as `TRPCError`. The client receives `TRPCClientError` with `error.message` and `error.data.httpStatus`.

| Domain Error | TRPCError code | HTTP Status |
|-------------|----------------|-------------|
| `WorkflowError` | `CONFLICT` | 409 |
| `ValidationError` (service) | `BAD_REQUEST` | 400 |
| `NotFoundError` | `NOT_FOUND` | 404 |
| Zod parse failure (input) | `BAD_REQUEST` | 400 |

---

## REST → tRPC Mapping

| Old REST endpoint | New tRPC procedure |
|-------------------|--------------------|
| `GET /api/jobs` | `trpc.jobs.list.useQuery()` |
| `POST /api/jobs` | `trpc.jobs.create.useMutation()` |
| `POST /api/jobs/:id/assign-reporter` | `trpc.jobs.assignReporter.useMutation()` |
| `POST /api/jobs/:id/mark-transcribed` | `trpc.jobs.markTranscribed.useMutation()` |
| `POST /api/jobs/:id/assign-editor` | `trpc.jobs.assignEditor.useMutation()` |
| `POST /api/jobs/:id/complete` | `trpc.jobs.complete.useMutation()` |
| `GET /api/reporters?jobCity=X` | `trpc.reporters.list.useQuery({ jobCity: X })` |
| `GET /api/editors` | `trpc.editors.list.useQuery()` |

All old REST routes (`/api/*`) are removed. The `/trpc` endpoint is the only API surface.
