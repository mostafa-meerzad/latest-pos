import prisma from "@/lib/prisma";

export async function getOrCreateWalkInCustomer(tx = prisma) {
  return await tx.customer.findFirstOrThrow({
    where: { name: "Walk-in Customer" }
  });
}
