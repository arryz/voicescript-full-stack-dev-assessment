import { createCallerFactory, appRouter } from '../trpc/router';
import { setupTestDb, teardownTestDb } from './helpers/testDb';
import { PrismaClient } from '@prisma/client';

const createCaller = createCallerFactory(appRouter);

let prisma!: PrismaClient;

beforeAll(async () => {
  prisma = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(prisma);
});

test('reporters.list returns all available reporters when no city filter', async () => {
  const caller = createCaller({ prisma });
  const reporters = await caller.reporters.list({});
  expect(reporters.length).toBe(3);
  reporters.forEach((r) => {
    expect(r).toHaveProperty('id');
    expect(r).toHaveProperty('name');
    expect(r).toHaveProperty('city');
    expect(r).toHaveProperty('is_available');
    expect(r).toHaveProperty('rate_per_minute');
  });
});

test('reporters.list with jobCity returns only reporters from that city', async () => {
  const caller = createCaller({ prisma });
  const jakartaReporters = await caller.reporters.list({ jobCity: 'Jakarta' });
  expect(jakartaReporters.length).toBe(2);
  jakartaReporters.forEach((r) => {
    expect(r.city).toBe('Jakarta');
  });
});

test('reporters.list with non-matching city returns empty array', async () => {
  const caller = createCaller({ prisma });
  const result = await caller.reporters.list({ jobCity: 'Medan' });
  expect(result).toHaveLength(0);
});
