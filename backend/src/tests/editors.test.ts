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

test('editors.list returns all editors with id and name fields', async () => {
  const caller = createCaller({ prisma });
  const editors = await caller.editors.list();
  expect(editors.length).toBe(2);
  editors.forEach((e) => {
    expect(e).toHaveProperty('id');
    expect(e).toHaveProperty('name');
    expect(e).toHaveProperty('flat_fee');
    expect(typeof e.id).toBe('number');
    expect(typeof e.name).toBe('string');
  });
});
