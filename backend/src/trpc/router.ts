import { initTRPC } from '@trpc/server';
import { Context } from './context';
import { jobsRouter } from './routers/jobs';
import { reportersRouter } from './routers/reporters';
import { editorsRouter } from './routers/editors';

const t = initTRPC.context<Context>().create();

export const appRouter = t.router({
  jobs: jobsRouter,
  reporters: reportersRouter,
  editors: editorsRouter,
});

export type AppRouter = typeof appRouter;
export const createCallerFactory = t.createCallerFactory;
