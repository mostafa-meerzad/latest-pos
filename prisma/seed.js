import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/index.js";
import { ROLES } from "../lib/roles.js";

const prisma = new PrismaClient();

async function main() {
  // === ROLES (static) ===
  for (const roleName of Object.values(ROLES)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {}, // do nothing if it already exists
      create: { name: roleName },
    });
  }
  console.log("✅ Roles seeded:", Object.values(ROLES));

  // === ADMIN USER ===
  const adminRole = await prisma.role.findUnique({
    where: { name: ROLES.ADMIN },
  });

  const PLAIN_ADMIN_PASSWORD = "admin123"; // change if needed

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      fullName: "System Admin",
      password: await bcrypt.hash(PLAIN_ADMIN_PASSWORD, 10),
      roleId: adminRole.id,
    },
    create: {
      username: "admin",
      fullName: "System Admin",
      password: await bcrypt.hash(PLAIN_ADMIN_PASSWORD, 10),
      roleId: adminRole.id,
    },
  });

  console.log("✅ Admin user seeded (username: admin)");
  console.log(`🔐 Password (plaintext): ${PLAIN_ADMIN_PASSWORD}`);
}

main()
  .then(() => {
    console.log("✅ Seeding finished.");
  })
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
