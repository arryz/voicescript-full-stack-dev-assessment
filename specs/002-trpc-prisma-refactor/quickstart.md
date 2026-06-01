# Quickstart: Type-Safe API and Data Layer Refactor

**Branch**: `002-trpc-prisma-refactor` | **Phase**: 1 | **Date**: 2026-06-01

## Prerequisites

- Node.js 20+
- npm (or pnpm)

---

## Setup (one-time, fresh install)

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure the database URL

Create `backend/.env`:

```
DATABASE_URL="file:./data/court_reporting.db"
```

This tells Prisma where to place the SQLite file (same location as the old `better-sqlite3` setup).

### 3. Apply migrations and seed

```bash
cd backend
npx prisma migrate dev --name init   # creates prisma/migrations/, applies schema, generates client
npx prisma db seed                   # inserts reporters + editors seed records
```

Or via the convenience script (after it is added to `backend/package.json`):

```bash
npm run db:setup
```

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the full stack

### Backend

```bash
cd backend
npm run dev
# Server listening on http://localhost:3001
# tRPC handler mounted at POST /trpc
```

### Frontend

```bash
cd frontend
npm run dev
# Vite dev server at http://localhost:5173
```

---

## Verifying end-to-end type safety (manual check)

1. Open `backend/src/trpc/routers/jobs.ts`.
2. In the `jobs.list` procedure, rename any field in the returned `JobListItem` (e.g. `reporter_name` → `reporterName`).
3. Save the file.
4. In the frontend directory, run `npm run build`.
5. TypeScript will report compile errors in every frontend hook or component that uses the renamed field.
6. Revert the rename — the build completes without errors.

This confirms SC-003: contract mismatch is caught at build time, not runtime.

---

## Running tests

```bash
cd backend
npm test
```

Integration tests use `createCallerFactory` to invoke tRPC procedures in-process against a real SQLite test database. No server startup is required.

---

## Applying future schema changes

```bash
cd backend
# 1. Edit backend/prisma/schema.prisma
# 2. Generate and apply migration
npx prisma migrate dev --name <descriptive-name>
# 3. Prisma client types are regenerated automatically
```

The TypeScript types update without any manual intervention — satisfying SC-005 (zero hand-written entity type definitions).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Environment variable not found: DATABASE_URL` | Create `backend/.env` with the path above |
| `Cannot find module '@backend/trpc/router'` | Confirm `frontend/tsconfig.json` has the `paths` alias and `frontend/vite.config.ts` has the `resolve.alias` entry |
| `PrismaClientInitializationError` on startup | Run `npx prisma migrate dev` to ensure the database file and schema exist |
| Frontend types not updating after schema change | Run `npx prisma generate` in the backend directory |
