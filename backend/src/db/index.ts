import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(path.join(dataDir, 'court_reporting.db'));

function runMigrations(database: Database.Database): void {
  const currentVersion = (database.pragma('user_version', { simple: true }) as number);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const match = file.match(/^(\d+)_/);
    if (!match) continue;
    const seq = parseInt(match[1], 10);
    if (seq <= currentVersion) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    database.exec(sql);
    database.pragma(`user_version = ${seq}`);
    console.log(`Applied migration: ${file}`);
  }
}

runMigrations(db);
