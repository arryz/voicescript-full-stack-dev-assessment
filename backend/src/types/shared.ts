import type { Reporter, Editor, Job as PrismaJob } from '@prisma/client';

// Re-export Prisma-generated base types (SC-005)
export type { Reporter, Editor };

// Domain-constrained union types enforced at the tRPC / service layer via Zod
export type JobStatus = 'NEW' | 'ASSIGNED' | 'TRANSCRIBED' | 'REVIEWED' | 'COMPLETED';
export type LocationType = 'physical' | 'remote';

// Job with domain-typed status/location_type and ISO string dates for service compatibility
export type Job = Omit<
  PrismaJob,
  'status' | 'location_type' | 'created_at' | 'assigned_at' | 'transcribed_at' | 'reviewed_at' | 'completed_at'
> & {
  status: JobStatus;
  location_type: LocationType;
  created_at: string;
  assigned_at: string | null;
  transcribed_at: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
};

// Computed view type for the job list (includes JOIN-derived pay and name fields)
export interface JobListItem {
  id: number;
  case_name: string;
  duration_minutes: number;
  location_type: LocationType;
  city: string | null;
  status: JobStatus;
  reporter_id: number | null;
  editor_id: number | null;
  created_at: string;
  assigned_at: string | null;
  transcribed_at: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
  reporter_name: string | null;
  reporter_pay: number;
  editor_name: string | null;
  editor_pay: number;
}

export interface CreateJobRequest {
  case_name: string;
  duration_minutes: number;
  location_type: LocationType;
  city?: string;
}

export interface AssignReporterRequest {
  reporter_id: number;
}

export interface AssignEditorRequest {
  editor_id: number;
}
