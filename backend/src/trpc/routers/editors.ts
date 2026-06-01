import { initTRPC } from '@trpc/server';
import { Context } from '../context';
import * as editorsDA from '../../data-access/editors';

const t = initTRPC.context<Context>().create();

export const editorsRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return editorsDA.listEditors(ctx.prisma);
  }),
});
