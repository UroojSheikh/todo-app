// One-off script to create the first superuser account.
// Run from your backend folder with: node createSuperuser.js
//
// Edit the values below before running, then you can delete this file
// (or keep it — running it again will just fail with "Email already registered"
// unless you change the email).

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "superuser@example.com";       // <-- change this
  const plainPassword = "ChangeMe123!";        // <-- change this
  const firstName = "Super";
  const lastName = "User";
  const dateOfBirth = new Date("1990-01-01");  // must be 18+, format doesn't matter beyond that
  const city = "N/A";
  const phone = "0000000000";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`A user with email ${email} already exists (role: ${existing.role}). Aborting.`);
    return;
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      dateOfBirth,
      city,
      phone,
      role: "SUPERUSER",
      status: "APPROVED",
      isVerified: true,
    },
  });

  console.log("Superuser created:");
  console.log({ id: user.id, email: user.email, role: user.role });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });