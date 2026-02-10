// Minimum seed file, you can use if for production

// import bcrypt from "bcryptjs";
// import { PrismaClient } from "../app/generated/prisma/index.js";
// import { ROLES } from "../lib/roles.js";

// const prisma = new PrismaClient();

// async function main() {
//   // === ROLES (static) ===
//   for (const roleName of Object.values(ROLES)) {
//     await prisma.role.upsert({
//       where: { name: roleName },
//       update: {},
//       create: { name: roleName },
//     });
//   }
//   console.log("✅ Roles seeded:", Object.values(ROLES));

//   // === ADMIN USER ===
//   const adminRole = await prisma.role.findUnique({
//     where: { name: ROLES.ADMIN },
//   });

//   const PLAIN_ADMIN_PASSWORD = "admin123"; // change if needed

//   await prisma.user.upsert({
//     where: { username: "admin" },
//     update: {
//       fullName: "System Admin",
//       password: await bcrypt.hash(PLAIN_ADMIN_PASSWORD, 10),
//       roleId: adminRole.id,
//     },
//     create: {
//       username: "admin",
//       fullName: "System Admin",
//       password: await bcrypt.hash(PLAIN_ADMIN_PASSWORD, 10),
//       roleId: adminRole.id,
//     },
//   });

//   console.log("✅ Admin user seeded (username: admin)");
//   console.log(`🔐 Password (plaintext): ${PLAIN_ADMIN_PASSWORD}`);

//   // === WALK-IN CUSTOMER ===
//   await prisma.customer.upsert({
//     where: { name: "WALK-IN CUSTOMER" },
//     update: {},
//     create: {
//       name: "WALK-IN CUSTOMER",
//       phone: null,
//       email: null,
//       address: null,
//     },
//   });

//   console.log("✅ WALK-IN CUSTOMER seeded.");
// }

// main()
//   .then(() => {
//     console.log("✅ Seeding finished.");
//   })
//   .catch((e) => {
//     console.error("❌ Error seeding database:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });


// 
// Seed file for development and testing

import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/index.js";
import { ROLES } from "../lib/roles.js";

const prisma = new PrismaClient();

async function main() {
  // === BRANCHES ===
  const mainBranch = await prisma.branch.upsert({
    where: { name: "Main Branch" },
    update: {},
    create: {
      name: "Main Branch",
      location: "Central Office",
      isMain: true,
    },
  });
  console.log("✅ Main Branch seeded");

  // === ROLES ===
  for (const roleName of Object.values(ROLES)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  console.log("✅ Roles seeded:", Object.values(ROLES));

  // === ADMIN USER ===
  const adminRole = await prisma.role.findUnique({
    where: { name: ROLES.ADMIN },
  });

  const PLAIN_ADMIN_PASSWORD = "admin123";

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      fullName: "System Admin",
      password: await bcrypt.hash(PLAIN_ADMIN_PASSWORD, 10),
      roleId: adminRole.id,
      branchId: mainBranch.id,
    },
    create: {
      username: "admin",
      fullName: "System Admin",
      password: await bcrypt.hash(PLAIN_ADMIN_PASSWORD, 10),
      roleId: adminRole.id,
      branchId: mainBranch.id,
    },
  });

  console.log("✅ Admin user seeded (username: admin)");
  console.log(`🔐 Password (plaintext): ${PLAIN_ADMIN_PASSWORD}`);

  // === WALK-IN CUSTOMER ===
  const existingCustomer = await prisma.customer.findFirst({
    where: { name: "WALK-IN CUSTOMER", branchId: mainBranch.id },
  });
  if (!existingCustomer) {
    await prisma.customer.create({
      data: {
        name: "WALK-IN CUSTOMER",
        lastName: null,
        phone: null,
        email: null,
        address: null,
        branchId: mainBranch.id,
      },
    });
    console.log("✅ WALK-IN CUSTOMER created.");
  } else {
    console.log("ℹ️ WALK-IN CUSTOMER already exists.");
  }

//   // === SUPPLIERS ===
//   const suppliersData = Array.from({ length: 10 }).map((_, i) => ({
//     name: `Supplier ${i + 1}`,
//     contactPerson: `Contact ${i + 1}`,
//     phone: `0900${100000 + i}`,
//     email: `supplier${i + 1}@example.com`,
//     address: `Supplier Address ${i + 1}`,
//   }));

//   await prisma.supplier.createMany({
//     data: suppliersData,
//     skipDuplicates: true,
//   });
//   console.log("✅ 10 suppliers seeded.");

//   // === CATEGORIES ===
//   const categoriesData = [
//     "Dog Food",
//     "Cat Food",
//     "Fish Supplies",
//     "Bird Supplies",
//     "Reptile Supplies",
//     "Small Animal Toys",
//     "Pet Grooming",
//     "Pet Medicine",
//     "Pet Accessories",
//     "Aquarium Equipment",
//   ].map((name) => ({ name }));

//   await prisma.category.createMany({
//     data: categoriesData,
//     skipDuplicates: true,
//   });
//   console.log("✅ 10 categories seeded.");

//   // === PRODUCTS ===
//   const categories = await prisma.category.findMany();
//   const suppliers = await prisma.supplier.findMany();

//   const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

//   const productsData = Array.from({ length: 20 }).map((_, i) => ({
//     name: `Product ${i + 1}`,
//     barcode: `P${1000 + i}`,
//     categoryId: randomFrom(categories).id,
//     supplierId: randomFrom(suppliers).id,
//     price: Math.floor(Math.random() * 2000) + 500, // between 500 - 2500
//     costPrice: Math.floor(Math.random() * 500) + 200, // between 200 - 700
//     stockQuantity: Math.floor(Math.random() * 50) + 50, // 50 - 100 units
//     expiryDate: null,
//   }));

//   await prisma.product.createMany({
//     data: productsData,
//     skipDuplicates: true,
//   });
//   console.log("✅ 20 products seeded.");

//   // === DELIVERY DRIVERS ===
//   const driversData = Array.from({ length: 8 }).map((_, i) => ({
//     name: `Driver ${i + 1}`,
//     phone: `0912${100000 + i}`,
//   }));

//   await prisma.deliveryDriver.createMany({
//     data: driversData,
//     skipDuplicates: true,
//   });
//   console.log("✅ 8 delivery drivers seeded.");

//   console.log("🎉 All seed data created successfully!");
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
