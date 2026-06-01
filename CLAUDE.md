# vs-full-stack-dev-assessment Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-06-01

## Active Technologies
- TypeScript 5.x (strict mode, both frontend and backend) + React 18 + Vite + Tailwind CSS (frontend), Express 4 + better-sqlite3 (backend) (001-court-reporting-workflow)
- SQLite via `better-sqlite3`; versioned `.sql` migration files applied on server startup (001-court-reporting-workflow)
- TypeScript 5.x (strict mode) (002-trpc-prisma-refactor)
- SQLite via Prisma (replaces direct `better-sqlite3`); `prisma migrate` manages versioned migrations (002-trpc-prisma-refactor)

- TypeScript 5.x (strict mode, both frontend and backend) + React 18 + Vite (frontend), Express 4 + better-sqlite3 (backend) (001-court-reporting-workflow)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode, both frontend and backend): Follow standard conventions

## Recent Changes
- 002-trpc-prisma-refactor: Added TypeScript 5.x (strict mode)
- 001-court-reporting-workflow: Added TypeScript 5.x (strict mode, both frontend and backend) + React 18 + Vite + Tailwind CSS (frontend), Express 4 + better-sqlite3 (backend)

- 001-court-reporting-workflow: Added TypeScript 5.x (strict mode, both frontend and backend) + React 18 + Vite (frontend), Express 4 + better-sqlite3 (backend)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
