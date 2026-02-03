// backend/prisma/create-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'milan@admin.com'; // <--- TVOJ EMAIL
  const password = 'mojasifrajaka'; // <--- TVOJA LOZINKA (Promeni ovo!)
  const firstName = 'Milan';
  
  console.log(`🛠️ Kreiram admin korisnika: ${email}...`);

  // 1. Proveri da li rola 'admin' postoji (za svaki slučaj)
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  });

  if (!adminRole) {
    throw new Error("GRESKA: Rola 'admin' ne postoji! Prvo pokreni seed skriptu.");
  }

  // 2. Kriptuj lozinku (OVO JE KLJUČNO!)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Kreiraj korisnika i poveži ga sa rolom
  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword, // Upisujemo haš, ne plain text
      firstName: firstName,
      roles: {
        create: {
          roleId: adminRole.id
        }
      }
    }
  });

  console.log('✅ USPEH! Admin kreiran.');
  console.log('-------------------------------------------');
  console.log(`📧 Email: ${user.email}`);
  console.log(`🔑 Password: ${password} (U bazi je sačuvan kao: ${hashedPassword.substring(0, 15)}...)`);
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