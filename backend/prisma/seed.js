// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Počinjem seeding (punjenje baze)...');

  // 1. Kreiraj 'admin' rolu ako ne postoji
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator sa potpunim pristupom',
    },
  });

  // 2. Kreiraj 'user' rolu ako ne postoji
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Standardni registrovani korisnik',
    },
  });

  console.log('✅ Kreirane role:', { adminRole, userRole });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });