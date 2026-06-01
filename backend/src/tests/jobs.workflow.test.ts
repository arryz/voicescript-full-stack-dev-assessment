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

test('full workflow: NEW → ASSIGNED → TRANSCRIBED → REVIEWED → COMPLETED', async () => {
  const caller = createCaller({ prisma });

  const created = await caller.jobs.create({
    case_name: 'Workflow v. Test',
    duration_minutes: 30,
    location_type: 'physical',
    city: 'Jakarta',
  });
  expect(created.status).toBe('NEW');

  const assigned = await caller.jobs.assignReporter({ id: created.id, reporter_id: 1 });
  expect(assigned.status).toBe('ASSIGNED');
  expect(assigned.reporter_id).toBe(1);

  const transcribed = await caller.jobs.markTranscribed({ id: created.id });
  expect(transcribed.status).toBe('TRANSCRIBED');

  const reviewed = await caller.jobs.assignEditor({ id: created.id, editor_id: 1 });
  expect(reviewed.status).toBe('REVIEWED');
  expect(reviewed.editor_id).toBe(1);

  const completed = await caller.jobs.complete({ id: created.id });
  expect(completed.status).toBe('COMPLETED');
});

test('assignReporter on a COMPLETED job throws CONFLICT', async () => {
  const caller = createCaller({ prisma });

  const created = await caller.jobs.create({
    case_name: 'Invalid v. Transition',
    duration_minutes: 10,
    location_type: 'remote',
  });

  await prisma.job.update({
    where: { id: created.id },
    data: { status: 'COMPLETED' },
  });

  await expect(
    caller.jobs.assignReporter({ id: created.id, reporter_id: 1 })
  ).rejects.toMatchObject({ code: 'CONFLICT' });
});

test('markTranscribed on a NEW job throws CONFLICT', async () => {
  const caller = createCaller({ prisma });

  const created = await caller.jobs.create({
    case_name: 'Skip v. Steps',
    duration_minutes: 15,
    location_type: 'remote',
  });

  await expect(
    caller.jobs.markTranscribed({ id: created.id })
  ).rejects.toMatchObject({ code: 'CONFLICT' });
});
