import {
  AssignEditorRequest,
  AssignReporterRequest,
  CreateJobRequest,
  Editor,
  JobListItem,
  Reporter,
} from '../types/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchJobs(): Promise<JobListItem[]> {
  return apiFetch<JobListItem[]>('/api/jobs');
}

export function createJob(data: CreateJobRequest): Promise<JobListItem> {
  return apiFetch<JobListItem>('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function fetchReporters(jobCity?: string): Promise<Reporter[]> {
  const qs = jobCity ? `?jobCity=${encodeURIComponent(jobCity)}` : '';
  return apiFetch<Reporter[]>(`/api/reporters${qs}`);
}

export function assignReporter(jobId: number, body: AssignReporterRequest): Promise<JobListItem> {
  return apiFetch<JobListItem>(`/api/jobs/${jobId}/assign-reporter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function markTranscribed(jobId: number): Promise<JobListItem> {
  return apiFetch<JobListItem>(`/api/jobs/${jobId}/mark-transcribed`, {
    method: 'POST',
  });
}

export function fetchEditors(): Promise<Editor[]> {
  return apiFetch<Editor[]>('/api/editors');
}

export function assignEditor(jobId: number, body: AssignEditorRequest): Promise<JobListItem> {
  return apiFetch<JobListItem>(`/api/jobs/${jobId}/assign-editor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function completeJob(jobId: number): Promise<JobListItem> {
  return apiFetch<JobListItem>(`/api/jobs/${jobId}/complete`, {
    method: 'POST',
  });
}
