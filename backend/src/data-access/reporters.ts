import { PrismaClient } from '@prisma/client';
import { Reporter } from '../types/shared';

const prisma = new PrismaClient();

export async function listReporters(
  prismaClient: PrismaClient = prisma,
  jobCity?: string
): Promise<Reporter[]> {
  return prismaClient.reporter.findMany({
    where: {
      is_available: true,
      ...(jobCity ? { city: jobCity } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

// Alias kept for service-layer compatibility
export async function listAvailableReporters(
  prismaClient: PrismaClient = prisma,
  jobCity: string | null
): Promise<Reporter[]> {
  return listReporters(prismaClient, jobCity ?? undefined);
}

export async function getReporterById(
  prismaClient: PrismaClient = prisma,
  id: number
): Promise<Reporter | undefined> {
  const row = await prismaClient.reporter.findUnique({ where: { id } });
  return row ?? undefined;
}
