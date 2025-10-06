import { PrismaClient } from "@/app/generated/prisma";

const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"], // Optional: Configure logging
  });

if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
}

export default prisma;
