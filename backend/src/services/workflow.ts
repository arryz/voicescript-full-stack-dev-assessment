import { JobStatus } from '../types/shared';

export const VALID_TRANSITIONS: Record<JobStatus, JobStatus | null> = {
  NEW: 'ASSIGNED',
  ASSIGNED: 'TRANSCRIBED',
  TRANSCRIBED: 'REVIEWED',
  REVIEWED: 'COMPLETED',
  COMPLETED: null,
};

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export function assertValidTransition(from: JobStatus, to: JobStatus): void {
  if (VALID_TRANSITIONS[from] !== to) {
    throw new WorkflowError(
      `Invalid transition: cannot move from ${from} to ${to}. Expected next status: ${VALID_TRANSITIONS[from] ?? 'none (already COMPLETED)'}`
    );
  }
}
