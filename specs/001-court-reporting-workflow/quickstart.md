# Quickstart: Court Reporting Workflow Manager

**Branch**: `001-court-reporting-workflow`

Separate terminals for backend and frontend. Both must be running for the app to work.

---

## Prerequisites

- Node.js 20 LTS
- npm ≥ 9 (bundled with Node 20)

---

## Backend

```bash
cd backend
npm install
npm run dev
```

Server starts on **http://localhost:3001**.

On first run (or when the `data/` directory is new), the migration runner creates and seeds the
SQLite database at `backend/data/court_reporting.db`. Subsequent runs skip already-applied
migrations.

**Scripts**:

| Script | Description |
|---|---|
| `npm run dev` | Start with ts-node-dev (auto-restart on file change) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled `dist/index.js` |

---

## Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

App opens at **http://localhost:5173**.

Vite proxies all `/api/*` requests to `http://localhost:3001`, so no CORS configuration is needed.

Tailwind CSS is compiled by the `@tailwindcss/vite` plugin — no separate PostCSS step required.
Styles are picked up automatically from all `src/**/*.{ts,tsx}` files as declared in
`tailwind.config.ts`.

**Scripts**:

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run type-check` | Run `tsc --noEmit` without bundling |

---

## Seed Data

The database is seeded automatically on first startup via `backend/src/db/migrations/002_seed.sql`.

**Reporters** (pre-seeded):

| Name | City | Available | Rate |
|---|---|---|---|
| Adi Santoso | Jakarta | Yes | 2,000 IDR/min |
| Budi Hartono | Jakarta | Yes | 2,000 IDR/min |
| Citra Dewi | Surabaya | Yes | 2,000 IDR/min |
| Dian Permata | Bandung | No | 2,000 IDR/min |

**Editors** (pre-seeded):

| Name | Flat Fee |
|---|---|
| Eka Rahardjo | 50,000 IDR |
| Farah Yunita | 50,000 IDR |

---

## Resetting the Database

Delete the database file and restart the backend to get a clean slate:

```bash
rm backend/data/court_reporting.db
npm run dev   # (in backend/)
```

---

## Verifying the API

Quick smoke test (requires `curl`):

```bash
# List all jobs (empty initially)
curl http://localhost:3001/api/jobs

# Create a job
curl -X POST http://localhost:3001/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{"case_name":"Smith v. Jones","duration_minutes":90,"location_type":"physical","city":"Jakarta"}'

# List available reporters sorted for Jakarta
curl 'http://localhost:3001/api/reporters?jobCity=Jakarta'
```
