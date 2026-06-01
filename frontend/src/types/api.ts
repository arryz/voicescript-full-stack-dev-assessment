export type JobStatus = 'NEW' | 'ASSIGNED' | 'TRANSCRIBED' | 'REVIEWED' | 'COMPLETED';
export type LocationType = 'physical' | 'remote';

export interface Reporter {
  id: number;
  name: string;
  city: string;
  is_available: boolean;
  rate_per_minute: number;
}

export interface Editor {
  id: number;
  name: string;
  flat_fee: number;
}

export interface Job {
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
}

export interface JobListItem extends Job {
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
