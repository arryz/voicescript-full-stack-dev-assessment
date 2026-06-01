import * as jobsDA from '../data-access/jobs';
import * as reportersDA from '../data-access/reporters';
import * as editorsDA from '../data-access/editors';
import { assertValidTransition, WorkflowError } from './workflow';
import { CreateJobRequest, JobListItem } from '../types/shared';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function createJob(data: CreateJobRequest): JobListItem {
  if (!data.case_name || data.case_name.trim().length === 0) {
    throw new ValidationError('case_name must be a non-empty string');
  }
  if (!Number.isInteger(data.duration_minutes) || data.duration_minutes < 1) {
    throw new ValidationError('duration_minutes must be a positive integer');
  }
  if (data.location_type !== 'physical' && data.location_type !== 'remote') {
    throw new ValidationError("location_type must be 'physical' or 'remote'");
  }
  if (data.location_type === 'physical' && (!data.city || data.city.trim().length === 0)) {
    throw new ValidationError('city is required for physical jobs');
  }
  return jobsDA.createJob(data);
}

export function assignReporter(jobId: number, reporterId: number): JobListItem {
  const job = jobsDA.getJobById(jobId);
  if (!job) throw new NotFoundError('Job not found');

  assertValidTransition(job.status, 'ASSIGNED');

  const reporter = reportersDA.getReporterById(reporterId);
  if (!reporter) throw new NotFoundError('Reporter not found');
  if (!reporter.is_available) {
    throw new WorkflowError('Reporter is not available');
  }

  jobsDA.updateJob(jobId, {
    reporter_id: reporterId,
    status: 'ASSIGNED',
    assigned_at: sqliteNow(),
  });

  return jobsDA.listJobById(jobId) as JobListItem;
}

export function markTranscribed(jobId: number): JobListItem {
  const job = jobsDA.getJobById(jobId);
  if (!job) throw new NotFoundError('Job not found');

  assertValidTransition(job.status, 'TRANSCRIBED');

  jobsDA.updateJob(jobId, {
    status: 'TRANSCRIBED',
    transcribed_at: sqliteNow(),
  });

  return jobsDA.listJobById(jobId) as JobListItem;
}

export function assignEditor(jobId: number, editorId: number): JobListItem {
  const job = jobsDA.getJobById(jobId);
  if (!job) throw new NotFoundError('Job not found');

  assertValidTransition(job.status, 'REVIEWED');

  const editor = editorsDA.getEditorById(editorId);
  if (!editor) throw new NotFoundError('Editor not found');

  jobsDA.updateJob(jobId, {
    editor_id: editorId,
    status: 'REVIEWED',
    reviewed_at: sqliteNow(),
  });

  return jobsDA.listJobById(jobId) as JobListItem;
}

export function completeJob(jobId: number): JobListItem {
  const job = jobsDA.getJobById(jobId);
  if (!job) throw new NotFoundError('Job not found');

  assertValidTransition(job.status, 'COMPLETED');

  jobsDA.updateJob(jobId, {
    status: 'COMPLETED',
    completed_at: sqliteNow(),
  });

  return jobsDA.listJobById(jobId) as JobListItem;
}

function sqliteNow(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
