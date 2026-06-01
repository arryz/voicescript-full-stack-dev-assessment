import { PrismaClient } from '@prisma/client';
import * as reportersDA from '../data-access/reporters';
import { Reporter } from '../types/shared';

export async function getAvailableReporters(prisma: PrismaClient, jobCity: string | null): Promise<Reporter[]> {
  return reportersDA.listAvailableReporters(prisma, jobCity);
}
