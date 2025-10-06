import prisma from "@/lib/prisma";

export async function getCustomerPurchaseHistory(customerId) {
  return await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      sales: {
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
          invoice: true,
          delivery: {
            include: {
              driver: true,
            },
          },
        },
      },
    },
  });
}
