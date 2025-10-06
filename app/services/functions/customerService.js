import prisma from "@/lib/prisma";

export async function getOrCreateWalkInCustomer(tx = prisma) {
  const count = await tx.customer.count({
    where: { name: { startsWith: "Walk-in" } },
  });
  const name = `Walk-in #${count + 1}`;
  const newCust = await tx.customer.create({ data: { name } });
  // return newCust.id;
  return newCust;
}
