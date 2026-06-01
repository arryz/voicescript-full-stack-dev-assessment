# Data Model: Type-Safe API and Data Layer Refactor

**Branch**: `002-trpc-prisma-refactor` | **Phase**: 1 | **Date**: 2026-06-01

## Prisma Schema (`backend/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Reporter {
  id              Int     @id @default(autoincrement())
  name            String
  city            String
  is_available    Boolean @default(true)
  rate_per_minute Int     @default(2000)
  jobs            Job[]

  @@map("reporters")
}

model Editor {
  id       Int   @id @default(autoincrement())
  name     String
  flat_fee Int    @default(50000)
  jobs     Job[]

  @@map("editors")
}

model Job {
  id               Int       @id @default(autoincrement())
  case_name        String
  duration_minutes Int
  location_type    String
  city             String?
  status           String    @default("NEW")
  reporter_id      Int?
  editor_id        Int?
  created_at       DateTime  @default(now())
  assigned_at      DateTime?
  transcribed_at   DateTime?
  reviewed_at      DateTime?
  completed_at     DateTime?

  reporter         Reporter? @relation(fields: [reporter_id], references: [id])
  editor           Editor?   @relation(fields: [editor_id], references: [id])

  @@map("jobs")
}
```

### Schema notes

- `@@map` directives preserve existing lowercase table names so migration SQL is compatible with any pre-existing data file.
- `rate_per_minute` and `flat_fee` are `Int` (integer smallest currency unit), matching the existing `INTEGER` SQLite column definition exactly.
- `status` and `location_type` are `String` in the database layer. The domain union types (`JobStatus`, `LocationType`) are enforced at the service and tRPC layer via Zod schemas and TypeScript casting — SQLite does not support native CHECK constraints in Prisma's migration output.
- `created_at` and the timestamp fields are `DateTime` in Prisma, stored as ISO 8601 text in SQLite (Prisma handles serialization).

---

## Domain Types (`backend/src/types/shared.ts`)

```ts
import type { Reporter, Editor, Job } from '@prisma/client';

// Re-export Prisma-generated base types (no manual definitions required — SC-005)
export type { Reporter, Editor, Job };

// Domain-constrained union types (enforced by Zod schemas, not the DB)
export type JobStatus = 'NEW' | 'ASSIGNED' | 'TRANSCRIBED' | 'REVIEWED' | 'COMPLETED';
export type LocationType = 'physical' | 'remote';

// Computed view type for the job list (includes JOIN-derived fields)
export interface JobListItem {
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
  reporter_name: string | null;
  reporter_pay: number;
  editor_name: string | null;
  editor_pay: number;
}

// Request shapes (kept for Zod schema reference and backward-compatibility with service signatures)
export interface CreateJobRequest {
  case_name: string;
  duration_minutes: number;
  location_type: LocationType;
  city?: string;
}

export interface AssignReporterRequest {
  reporter_id: number;
}

export interface AssignEditorRequest {
  editor_id: number;
}
```

`JobListItem` is the only hand-written interface because it represents a computed view (JOIN + arithmetic) that has no direct Prisma model equivalent.

---

## Entity Relationships

```
Reporter 1──* Job  (jobs.reporter_id FK, nullable — unassigned state)
Editor   1──* Job  (jobs.editor_id FK, nullable — pre-edit state)
```

No many-to-many junction tables. Assignments are direct nullable foreign keys on `Job`.

---

## Workflow State Machine

Unchanged from `backend/src/services/workflow.ts`. Valid transitions:

```
NEW → ASSIGNED → TRANSCRIBED → REVIEWED → COMPLETED
```

All status writes go through `assertValidTransition(from, to)`. tRPC procedures call the service function — they never write `job.status` directly.

---

## Zod Input Schemas (`backend/src/trpc/schemas.ts`)

```ts
import { z } from 'zod';

export const CreateJobSchema = z.object({
  case_name: z.string().min(1),
  duration_minutes: z.number().int().positive(),
  location_type: z.enum(['physical', 'remote']),
  city: z.string().optional(),
});

export const AssignReporterSchema = z.object({
  id: z.number().int().positive(),
  reporter_id: z.number().int().positive(),
});

export const AssignEditorSchema = z.object({
  id: z.number().int().positive(),
  editor_id: z.number().int().positive(),
});

export const JobIdSchema = z.object({
  id: z.number().int().positive(),
});

export const ListReportersSchema = z.object({
  jobCity: z.string().optional(),
});
```

These schemas are the authoritative input type source for tRPC procedures. The TypeScript input types are inferred from them — no separate interface declarations required.

---

## Seed Data (`backend/prisma/seed.ts`)

Inserts the same records as the current `002_seed.sql` migration:

| Table | Records |
|-------|---------|
| reporters | Adi Santoso (Jakarta), Budi Hartono (Jakarta), Citra Dewi (Surabaya), Dian Permata (Bandung, unavailable) |
| editors | Eka Rahardjo, Farah Yunita |
| jobs | none (created at runtime) |

`rate_per_minute` = 2000 for all reporters. `flat_fee` = 50000 for all editors.
