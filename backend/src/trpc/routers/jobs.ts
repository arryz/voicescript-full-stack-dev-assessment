import { TRPCError, initTRPC } from '@trpc/server';
import { Context } from '../context';
import { CreateJobSchema, AssignReporterSchema, AssignEditorSchema, JobIdSchema } from '../schemas';
import * as jobsService from '../../services/jobs';
import * as jobsDA from '../../data-access/jobs';
import { WorkflowError } from '../../services/workflow';
import { ValidationError, NotFoundError } from '../../services/jobs';

const t = initTRPC.context<Context>().create();

function mapError(err: unknown): never {
  if (err instanceof WorkflowError) {
    throw new TRPCError({ code: 'CONFLICT', message: (err as Error).message });
  }
  if (err instanceof NotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: (err as Error).message });
  }
  if (err instanceof ValidationError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: (err as Error).message });
  }
  throw err;
}

export const jobsRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return jobsDA.listJobs(ctx.prisma);
  }),

  create: t.procedure.input(CreateJobSchema).mutation(async ({ ctx, input }) => {
    try {
      return await jobsService.createJob(ctx.prisma, input);
    } catch (err) {
      mapError(err);
    }
  }),

  assignReporter: t.procedure.input(AssignReporterSchema).mutation(async ({ ctx, input }) => {
    try {
      return await jobsService.assignReporter(ctx.prisma, input.id, input.reporter_id);
    } catch (err) {
      mapError(err);
    }
  }),

  markTranscribed: t.procedure.input(JobIdSchema).mutation(async ({ ctx, input }) => {
    try {
      return await jobsService.markTranscribed(ctx.prisma, input.id);
    } catch (err) {
      mapError(err);
    }
  }),

  assignEditor: t.procedure.input(AssignEditorSchema).mutation(async ({ ctx, input }) => {
    try {
      return await jobsService.assignEditor(ctx.prisma, input.id, input.editor_id);
    } catch (err) {
      mapError(err);
    }
  }),

  complete: t.procedure.input(JobIdSchema).mutation(async ({ ctx, input }) => {
    try {
      return await jobsService.completeJob(ctx.prisma, input.id);
    } catch (err) {
      mapError(err);
    }
  }),
});
