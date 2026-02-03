const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Uloge (ako ne postoje)
  await prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } });
  await prisma.role.upsert({ where: { name: 'user' }, update: {}, create: { name: 'user' } });

  // 2. Uređaji (Prvo brišemo stare da ne dupliramo ako pokrećeš više puta)
  await prisma.device.deleteMany();

  await prisma.device.createMany({
    data: [
      { name: "Dnevna Soba Svetlo", type: "light", isOn: false, value: 80 },
      { name: "Ulazna Vrata", type: "lock", isLocked: true },
      { name: "Termostat", type: "temp", isOn: true, value: 22 },
      { name: "Garaža", type: "garage", isOpen: false },
      { name: "Muzika (Spotify)", type: "music", isOn: false, value: 50 }, // value je ovde glasnoća
      { name: "Roletne Spavaća", type: "blinds", value: 10 }
    ]
  });

  console.log('✅ Uređaji su ubačeni u bazu!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });