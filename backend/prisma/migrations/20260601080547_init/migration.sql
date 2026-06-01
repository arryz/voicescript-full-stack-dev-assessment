-- CreateTable
CREATE TABLE "reporters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "rate_per_minute" INTEGER NOT NULL DEFAULT 2000
);

-- CreateTable
CREATE TABLE "editors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "flat_fee" INTEGER NOT NULL DEFAULT 50000
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "case_name" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "location_type" TEXT NOT NULL,
    "city" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "reporter_id" INTEGER,
    "editor_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_at" DATETIME,
    "transcribed_at" DATETIME,
    "reviewed_at" DATETIME,
    "completed_at" DATETIME,
    CONSTRAINT "jobs_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "reporters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "jobs_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "editors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
