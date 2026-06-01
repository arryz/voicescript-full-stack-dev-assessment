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

beforeEach(async () => {
  await prisma.job.deleteMany();
});

test('jobs.list returns an empty array when no jobs exist', async () => {
  const caller = createCaller({ prisma });
  const jobs = await caller.jobs.list();
  expect(Array.isArray(jobs)).toBe(true);
  expect(jobs).toHaveLength(0);
});

test('jobs.list returns jobs with required fields and correct computed values', async () => {
  const job = await prisma.job.create({
    data: {
      case_name: 'Test v. Case',
      duration_minutes: 60,
      location_type: 'physical',
      city: 'Jakarta',
      status: 'ASSIGNED',
      reporter_id: 1,
    },
  });

  const caller = createCaller({ prisma });
  const jobs = await caller.jobs.list();

  expect(jobs).toHaveLength(1);
  const item = jobs[0];
  expect(item.id).toBe(job.id);
  expect(item.case_name).toBe('Test v. Case');
  expect(item.status).toBe('ASSIGNED');
  expect(typeof item.reporter_pay).toBe('number');
  expect(typeof item.editor_pay).toBe('number');
  expect(item.reporter_pay).toBe(60 * 2000);
  expect(item.editor_pay).toBe(0);
  expect(typeof item.reporter_name).toBe('string');
  expect(item.editor_name).toBeNull();
});
