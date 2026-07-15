// One-off script to change the password of an existing user (e.g. the superuser).
// Run from your backend folder with: node changePassword.js

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "superuser@example.com";   // <-- the account's email
  const newPassword = "password123";   // <-- the new password you want

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    console.log(`No user found with email ${email}.`);
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  console.log(`Password updated for ${user.email} (role: ${user.role}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });