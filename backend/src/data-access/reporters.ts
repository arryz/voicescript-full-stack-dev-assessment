import { db } from '../db/index';
import { Reporter } from '../types/shared';

export function listAvailableReporters(jobCity: string | null): Reporter[] {
  if (jobCity) {
    return db
      .prepare(
        `SELECT * FROM reporters
         WHERE is_available = 1
         ORDER BY CASE WHEN city = ? THEN 0 ELSE 1 END, name ASC`
      )
      .all(jobCity) as Reporter[];
  }
  return db
    .prepare('SELECT * FROM reporters WHERE is_available = 1 ORDER BY name ASC')
    .all() as Reporter[];
}

export function getReporterById(id: number): Reporter | undefined {
  return db.prepare('SELECT * FROM reporters WHERE id = ?').get(id) as Reporter | undefined;
}
