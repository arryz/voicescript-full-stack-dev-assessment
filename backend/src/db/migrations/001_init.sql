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
