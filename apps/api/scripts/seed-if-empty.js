// Render: agar baza xoli boshad (hanuz user nest), seed yak bor ijro meshavad. Ba'd — hech vaqt (seed bazaro pok mekunad).
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('node:child_process');

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.user.count();
  await prisma.$disconnect();
  if (users > 0) return console.log(`Seed lozim nest: dar baza ${users} user hast`);
  console.log('Baza xoli ast — seed ijro meshavad...');
  execSync('pnpm db:seed', { stdio: 'inherit' });
}

main().catch((err) => {
  console.error(`Seed nashud: ${err.message}`);
});
