import { initTRPC } from '@trpc/server';
import { Context } from '../context';
import { ListReportersSchema } from '../schemas';
import * as reportersDA from '../../data-access/reporters';

const t = initTRPC.context<Context>().create();

export const reportersRouter = t.router({
  list: t.procedure.input(ListReportersSchema).query(async ({ ctx, input }) => {
    return reportersDA.listReporters(ctx.prisma, input.jobCity);
  }),
});
