import { PrismaClient } from '@prisma/client';
import type { Job as PrismaJob, Reporter, Editor } from '@prisma/client';
import { CreateJobRequest, Job, JobListItem, JobStatus, LocationType } from '../types/shared';

type PrismaJobWithRelations = PrismaJob & {
  reporter: Reporter | null;
  editor: Editor | null;
};

function toJobListItem(row: PrismaJobWithRelations): JobListItem {
  return {
    id: row.id,
    case_name: row.case_name,
    duration_minutes: row.duration_minutes,
    location_type: row.location_type as LocationType,
    city: row.city,
    status: row.status as JobStatus,
    reporter_id: row.reporter_id,
    editor_id: row.editor_id,
    created_at: row.created_at.toISOString(),
    assigned_at: row.assigned_at?.toISOString() ?? null,
    transcribed_at: row.transcribed_at?.toISOString() ?? null,
    reviewed_at: row.reviewed_at?.toISOString() ?? null,
    completed_at: row.completed_at?.toISOString() ?? null,
    reporter_name: row.reporter?.name ?? null,
    reporter_pay: row.reporter ? row.duration_minutes * row.reporter.rate_per_minute : 0,
    editor_name: row.editor?.name ?? null,
    editor_pay: row.editor?.flat_fee ?? 0,
  };
}

function toJob(row: PrismaJob): Job {
  return {
    id: row.id,
    case_name: row.case_name,
    duration_minutes: row.duration_minutes,
    location_type: row.location_type as LocationType,
    city: row.city,
    status: row.status as JobStatus,
    reporter_id: row.reporter_id,
    editor_id: row.editor_id,
    created_at: row.created_at.toISOString(),
    assigned_at: row.assigned_at?.toISOString() ?? null,
    transcribed_at: row.transcribed_at?.toISOString() ?? null,
    reviewed_at: row.reviewed_at?.toISOString() ?? null,
    completed_at: row.completed_at?.toISOString() ?? null,
  };
}

const defaultPrisma = new PrismaClient();

export async function listJobs(prisma: PrismaClient = defaultPrisma): Promise<JobListItem[]> {
  const rows = await prisma.job.findMany({
    include: { reporter: true, editor: true },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(toJobListItem);
}

export async function getJobById(prisma: PrismaClient = defaultPrisma, id: number): Promise<Job | undefined> {
  const row = await prisma.job.findUnique({ where: { id } });
  return row ? toJob(row) : undefined;
}

export async function listJobById(prisma: PrismaClient = defaultPrisma, id: number): Promise<JobListItem | undefined> {
  const row = await prisma.job.findUnique({
    where: { id },
    include: { reporter: true, editor: true },
  });
  return row ? toJobListItem(row) : undefined;
}

export async function createJob(prisma: PrismaClient = defaultPrisma, data: CreateJobRequest): Promise<JobListItem> {
  const row = await prisma.job.create({
    data: {
      case_name: data.case_name,
      duration_minutes: data.duration_minutes,
      location_type: data.location_type,
      city: data.city ?? null,
    },
    include: { reporter: true, editor: true },
  });
  return toJobListItem(row);
}

export async function updateJob(
  prisma: PrismaClient = defaultPrisma,
  id: number,
  fields: Record<string, unknown>
): Promise<void> {
  const dateFields = ['assigned_at', 'transcribed_at', 'reviewed_at', 'completed_at', 'created_at'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (dateFields.includes(key) && typeof value === 'string') {
      data[key] = new Date(value);
    } else {
      data[key] = value;
    }
  }
  await prisma.job.update({ where: { id }, data });
}
