import { db } from '../db/index';
import { CreateJobRequest, Job, JobListItem } from '../types/shared';

const LIST_JOBS_SQL = `
  SELECT
    j.*,
    r.name AS reporter_name,
    COALESCE(j.duration_minutes * r.rate_per_minute, 0) AS reporter_pay,
    e.name AS editor_name,
    COALESCE(e.flat_fee, 0) AS editor_pay
  FROM jobs j
  LEFT JOIN reporters r ON j.reporter_id = r.id
  LEFT JOIN editors e ON j.editor_id = e.id
`;

const LIST_JOB_BY_ID_SQL = `
  SELECT
    j.*,
    r.name AS reporter_name,
    COALESCE(j.duration_minutes * r.rate_per_minute, 0) AS reporter_pay,
    e.name AS editor_name,
    COALESCE(e.flat_fee, 0) AS editor_pay
  FROM jobs j
  LEFT JOIN reporters r ON j.reporter_id = r.id
  LEFT JOIN editors e ON j.editor_id = e.id
  WHERE j.id = ?
  LIMIT 1
`;

export function createJob(data: CreateJobRequest): JobListItem {
  const stmt = db.prepare(`
    INSERT INTO jobs (case_name, duration_minutes, location_type, city)
    VALUES (@case_name, @duration_minutes, @location_type, @city)
  `);
  const result = stmt.run({
    case_name: data.case_name,
    duration_minutes: data.duration_minutes,
    location_type: data.location_type,
    city: data.city ?? null,
  });
  return listJobById(result.lastInsertRowid as number) as JobListItem;
}

export function listJobs(): JobListItem[] {
  return db.prepare(`${LIST_JOBS_SQL} ORDER BY j.created_at DESC`).all() as JobListItem[];
}

export function getJobById(id: number): Job | undefined {
  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined;
}

export function listJobById(id: number): JobListItem | undefined {
  return db.prepare(LIST_JOB_BY_ID_SQL).get(id) as JobListItem | undefined;
}

export function updateJob(id: number, fields: Record<string, unknown>): void {
  const entries = Object.entries(fields);
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE jobs SET ${setClauses} WHERE id = @id`).run({ ...fields, id });
}
