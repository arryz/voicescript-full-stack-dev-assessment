import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.reporter.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Adi Santoso', city: 'Jakarta', is_available: true, rate_per_minute: 2000 },
  });
  await prisma.reporter.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Budi Hartono', city: 'Jakarta', is_available: true, rate_per_minute: 2000 },
  });
  await prisma.reporter.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Citra Dewi', city: 'Surabaya', is_available: true, rate_per_minute: 2000 },
  });
  await prisma.reporter.upsert({
    where: { id: 4 },
    update: {},
    create: { name: 'Dian Permata', city: 'Bandung', is_available: false, rate_per_minute: 2000 },
  });
  await prisma.editor.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Eka Rahardjo', flat_fee: 50000 },
  });
  await prisma.editor.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Farah Yunita', flat_fee: 50000 },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
