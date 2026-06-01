# Research: Type-Safe API and Data Layer Refactor

**Branch**: `002-trpc-prisma-refactor` | **Phase**: 0 | **Date**: 2026-06-01

## 1. tRPC v11 with Express

**Decision**: Use tRPC v11 (`@trpc/server@11`) with the built-in Express adapter.
**Rationale**: v11 is the current stable major. It ships with native fetch-based handlers and retains `@trpc/server/adapters/express`, keeping the Express setup minimal and the existing server architecture unchanged.
**Alternatives considered**: tRPC v10 (older, v11 is backward-compatible and has improved error types). Standalone Fastify adapter (no reason to switch HTTP framework mid-assessment).

### Backend installation

```bash
npm install @trpc/server zod
```

### Express wiring (backend/src/index.ts)

```ts
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';

app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));
```

### AppRouter type export

```ts
// backend/src/trpc/router.ts
export const appRouter = router({ jobs: jobsRouter, reporters: reportersRouter, editors: editorsRouter });
export type AppRouter = typeof appRouter;
```

The frontend imports this type — never the implementation — so no backend code ships to the browser.

---

## 2. Prisma 5.x with SQLite

**Decision**: Prisma 5.x as the data-access layer; SQLite datasource; `prisma migrate dev` workflow.
**Rationale**: Prisma auto-generates a fully-typed client from `schema.prisma`, eliminating all hand-written TypeScript type definitions for database entities (SC-005). `prisma migrate` produces versioned `.sql` files in `prisma/migrations/` that satisfy the versioned migration requirement (Principle V).
**Alternatives considered**: Drizzle ORM (also TypeScript-first but less mature CLI tooling; Prisma is the clearer signal for an assessment). Keeping `better-sqlite3` + manual types (does not satisfy SC-005 or SC-003 for the data-access contract).

### Backend installation

```bash
npm install @prisma/client
npm install -D prisma
```

### Schema location

`backend/prisma/schema.prisma` — Prisma CLI default; no custom path configuration required.

### Migration workflow

```bash
cd backend
npx prisma migrate dev --name init   # generates prisma/migrations/ SQL + applies
npx prisma generate                  # regenerates typed client (auto-run after migrate dev)
```

### Money fields

`rate_per_minute` and `flat_fee` are stored as SQLite `INTEGER` (smallest currency unit). Prisma maps `INTEGER` → TypeScript `number`. The existing computation `duration_minutes * rate_per_minute` is performed in TypeScript inside the data-access layer after a Prisma relational query (see §7 below).

### DATABASE_URL

Prisma reads the SQLite path from the `DATABASE_URL` environment variable. Set in `backend/.env`:

```
DATABASE_URL="file:./data/court_reporting.db"
```

This keeps the database file in the same location as the current `better-sqlite3` setup.

---

## 3. Type Sharing: Frontend ↔ Backend

**Decision**: Vite/tsconfig path alias (`@backend → ../backend/src`) in the frontend. The frontend imports `AppRouter` as a **type-only** import — erased by TypeScript compilation, never shipped to the browser.
**Rationale**: No extra workspace package or root `package.json` required. The existing two-package structure is unchanged. Vite resolves the alias at build time.
**Alternatives considered**: pnpm workspaces with a `shared/` package (heavier setup; appropriate for production teams, overkill for a single-developer assessment). Duplicate types in frontend (violates FR-001 — divergence still possible).

### frontend/tsconfig.json addition

```json
{
  "compilerOptions": {
    "paths": {
      "@backend/*": ["../backend/src/*"]
    }
  }
}
```

### frontend/vite.config.ts addition

```ts
import path from 'path';

resolve: {
  alias: {
    '@backend': path.resolve(__dirname, '../backend/src'),
  },
},
```

### Frontend tRPC client (frontend/src/lib/trpc.ts)

```ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@backend/trpc/router';

export const trpc = createTRPCReact<AppRouter>();
```

---

## 4. TanStack Query v5 + @trpc/react-query

**Decision**: `@tanstack/react-query@5` + `@trpc/react-query@11`.
**Rationale**: `@trpc/react-query@11` requires TanStack Query v5. The upgrade from v4 → v5 is non-breaking for this codebase (the hooks API is identical; `cacheTime` → `gcTime` rename is irrelevant since no custom cache config exists).
**Alternatives considered**: `@trpc/client` with `useEffect` + `useState` (no caching, no loading states, more code in each hook — a step backward from the current setup).

### Frontend installation

```bash
npm install @trpc/client @trpc/react-query @tanstack/react-query
```

### Provider setup (frontend/src/main.tsx)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from './lib/trpc';
import { httpBatchLink } from '@trpc/client';

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [httpBatchLink({ url: '/trpc' })],
});

root.render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
```

---

## 5. Input Validation with Zod

**Decision**: Zod schemas for all tRPC procedure inputs. Defined in `backend/src/trpc/schemas.ts`.
**Rationale**: tRPC's first-class validator; the Zod schema drives the TypeScript input type on both the server and client. Replaces manual `ValidationError` throws in services for input shape validation. Service-layer business rule validation (e.g. reporter not found) remains in the service as `TRPCError`.
**Alternatives considered**: Keeping service-layer validation only (valid, but the tRPC client would not infer the correct input type without a schema).

---

## 6. Testing tRPC Procedures

**Decision**: `createCallerFactory` from `@trpc/server` for integration tests.
**Rationale**: Allows calling procedures in-process with a real Prisma client connected to a test SQLite database. No HTTP server startup required. Cleaner than Supertest for testing procedure logic.

```ts
import { createCallerFactory } from '@trpc/server';
import { appRouter } from '../src/trpc/router';
import { PrismaClient } from '@prisma/client';

const createCaller = createCallerFactory(appRouter);
const prisma = new PrismaClient({ datasources: { db: { url: 'file:./test.db' } } });
const caller = createCaller({ prisma });

test('jobs.list returns all jobs', async () => {
  const jobs = await caller.jobs.list();
  expect(Array.isArray(jobs)).toBe(true);
});
```

**Alternatives considered**: Supertest on the full Express app (still valid for smoke tests; can coexist with caller-based tests for core procedure coverage).

---

## 7. JobListItem Computed Fields

**Decision**: Compute `reporter_pay` and `editor_pay` in TypeScript inside the data-access layer after a Prisma `findMany` with `include: { reporter: true, editor: true }`.
**Rationale**: Prisma's fluent API does not expose arbitrary SQL expressions (`duration_minutes * rate_per_minute`) as selected columns. Computing in TypeScript after fetch is type-safe and avoids `$queryRaw` (which bypasses Prisma type inference).

```ts
const rows = await prisma.job.findMany({
  include: { reporter: true, editor: true },
  orderBy: { created_at: 'desc' },
});

return rows.map((row) => ({
  ...row,
  reporter_name: row.reporter?.name ?? null,
  reporter_pay: row.reporter ? row.duration_minutes * row.reporter.rate_per_minute : 0,
  editor_name: row.editor?.name ?? null,
  editor_pay: row.editor?.flat_fee ?? 0,
}));
```

**Alternatives considered**: `$queryRaw` with the original SQL (preserves existing query; loses Prisma type inference on the result — requires manual casting, which violates SC-005 spirit). Prisma virtual fields — not a Prisma feature.

---

## 8. Seed Data Strategy

**Decision**: Prisma seed script (`backend/prisma/seed.ts`) replaces `002_seed.sql`. Configured in `backend/package.json` under `"prisma": { "seed": "ts-node prisma/seed.ts" }`.
**Rationale**: `npx prisma db seed` is the standard Prisma workflow. The seed script uses the Prisma client to insert the same records currently in `002_seed.sql` — ensuring SC-007 (identical seed records).
**Alternatives considered**: Keeping `002_seed.sql` as a raw migration (valid, but mixes two migration systems; the Prisma approach is cleaner and idiomatic).
