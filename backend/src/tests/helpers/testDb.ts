import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

const BACKEND_DIR = path.resolve(__dirname, '../../../');
const TEST_DB_URL = 'file:./test.db';

export async function setupTestDb(): Promise<PrismaClient> {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    cwd: BACKEND_DIR,
    stdio: 'pipe',
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });

  await prisma.$connect();

  // Seed with explicit IDs so reporter_id FK references remain stable across runs
  await prisma.reporter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Adi Santoso', city: 'Jakarta', is_available: true, rate_per_minute: 2000 },
  });
  await prisma.reporter.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Budi Hartono', city: 'Jakarta', is_available: true, rate_per_minute: 2000 },
  });
  await prisma.reporter.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Citra Dewi', city: 'Surabaya', is_available: true, rate_per_minute: 2000 },
  });
  await prisma.reporter.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, name: 'Dian Permata', city: 'Bandung', is_available: false, rate_per_minute: 2000 },
  });
  await prisma.editor.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Eka Rahardjo', flat_fee: 50000 },
  });
  await prisma.editor.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Farah Yunita', flat_fee: 50000 },
  });

  return prisma;
}

export async function teardownTestDb(prisma: PrismaClient | undefined): Promise<void> {
  if (!prisma) return;
  // Only delete jobs — reporters and editors are stable seed data
  await prisma.job.deleteMany();
  await prisma.$disconnect();
}
