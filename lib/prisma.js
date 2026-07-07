import { PrismaClient } from "@/app/generated/prisma";

const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
}

export default prisma;
