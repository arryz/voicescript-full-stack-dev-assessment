import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server';
import type { AppRouter } from '@backend/trpc/router';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouterInputs = inferRouterInputs<AppRouter>;

export type JobListItem = RouterOutputs['jobs']['list'][number];
export type Reporter = RouterOutputs['reporters']['list'][number];
export type Editor = RouterOutputs['editors']['list'][number];

export type CreateJobRequest = RouterInputs['jobs']['create'];
export type AssignReporterRequest = Pick<RouterInputs['jobs']['assignReporter'], 'reporter_id'>;
export type AssignEditorRequest = Pick<RouterInputs['jobs']['assignEditor'], 'editor_id'>;

// Domain union types still needed as local value types for form state
export type JobStatus = 'NEW' | 'ASSIGNED' | 'TRANSCRIBED' | 'REVIEWED' | 'COMPLETED';
export type LocationType = 'physical' | 'remote';
