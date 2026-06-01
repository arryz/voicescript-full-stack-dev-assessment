# Court Reporting Workflow Manager

A single-screen web dashboard for agency staff to manage court reporting jobs — from creation through transcription, review, and completion — with inline payment display.

---

## Getting Started

You need two terminals running simultaneously: one for the backend and one for the frontend.

### Prerequisites

- Node.js 20 LTS or later
- npm 9 or later (bundled with Node 20)

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The API server starts at **http://localhost:3001**.

On first run the migration runner automatically creates and seeds the SQLite database at `backend/data/court_reporting.db`. Subsequent starts skip already-applied migrations.

### 2. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**.

Vite proxies all `/api/*` requests to the backend, so no extra CORS configuration is needed.

---

## Features

### Job Management

Create court reporting jobs with the following details:

- **Case Name** — the name of the court case (e.g. "Smith v. Jones")
- **Duration** — length of the session in minutes
- **Location Type** — Physical (requires a city) or Remote
- **City** — required for physical jobs; used to surface same-city reporters first

Every job starts in **NEW** status and moves through a strict, linear workflow.

### Reporter Assignment

Assign an available reporter to any NEW job:

- Only available reporters are shown in the assignment modal
- For physical jobs, reporters based in the same city as the job are highlighted and listed first
- Assigning a reporter advances the job to **ASSIGNED** status

### Transcription Tracking

Once a reporter completes their work, staff clicks **Mark Transcribed** to advance the job to **TRANSCRIBED** status.

### Editor Assignment

Assign an editor to any TRANSCRIBED job:

- All editors are listed in the assignment modal
- Assigning an editor advances the job to **REVIEWED** status

### Job Completion

Staff clicks **Complete** on any REVIEWED job to mark it **COMPLETED**.

### Payment Display

Every row on the dashboard shows calculated payments inline:

- **Reporter Pay** — `duration × reporter's per-minute rate` (e.g. 90 min × 2,000 IDR/min = 180,000 IDR)
- **Editor Pay** — editor's flat fee per job (e.g. 50,000 IDR)
- Unassigned slots show `—`

---

## Workflow

Jobs move through a fixed, one-way state machine:

```
NEW → ASSIGNED → TRANSCRIBED → REVIEWED → COMPLETED
```

| Status | Triggered by | What changes |
|---|---|---|
| NEW | Job created | — |
| ASSIGNED | Assign Reporter | Reporter linked; `assigned_at` set |
| TRANSCRIBED | Mark Transcribed | `transcribed_at` set |
| REVIEWED | Assign Editor | Editor linked; `reviewed_at` set |
| COMPLETED | Complete | `completed_at` set |

Attempting any out-of-order transition (e.g. assigning an editor to a NEW job) returns an error with a descriptive message.

---

## How to Use the Dashboard

1. **Create a job** — fill in the form at the top of the page and click **Create Job**. The new job appears in the table with status NEW.

2. **Assign a reporter** — click **Assign Reporter** on a NEW job. A modal opens showing available reporters; for physical jobs, same-city reporters appear first with a green badge. Click **Select** next to a reporter.

3. **Mark as transcribed** — once the reporter finishes, click **Mark Transcribed** on an ASSIGNED job.

4. **Assign an editor** — click **Assign Editor** on a TRANSCRIBED job. Select an editor from the modal.

5. **Complete the job** — click **Complete** on a REVIEWED job to close it out.

6. **View payments** — the Reporter Pay and Editor Pay columns update automatically as assignments are made.

---

## Seed Data

The database is pre-seeded on first startup.

**Reporters:**

| Name | City | Available | Rate |
|---|---|---|---|
| Adi Santoso | Jakarta | Yes | 2,000 IDR/min |
| Budi Hartono | Jakarta | Yes | 2,000 IDR/min |
| Citra Dewi | Surabaya | Yes | 2,000 IDR/min |
| Dian Permata | Bandung | No | 2,000 IDR/min |

**Editors:**

| Name | Flat Fee |
|---|---|
| Eka Rahardjo | 50,000 IDR |
| Farah Yunita | 50,000 IDR |

---

## Resetting the Database

Delete the database file and restart the backend:

```bash
rm backend/data/court_reporting.db
cd backend && npm run dev
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express 4, TypeScript |
| Database | SQLite via better-sqlite3 |

---

## Available Scripts

### Backend (`cd backend`)

| Script | Description |
|---|---|
| `npm run dev` | Start with ts-node-dev (auto-restarts on file change) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled `dist/index.js` |

### Frontend (`cd frontend`)

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run type-check` | Run TypeScript check without bundling |
