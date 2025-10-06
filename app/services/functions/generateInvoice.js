import prisma from "@/lib/prisma";

function generateInvoiceNumber(id) {
  const year = new Date().getFullYear();
  return `INV-${year}-${id.toString().padStart(4, "0")}`;
}

export async function generateInvoice(saleId) {
  // Check if invoice already exists
  let invoice = await prisma.invoice.findUnique({
    where: { saleId },
    include: {
      sale: {
        include: {
          customer: true,
          user: { select: { fullName: true } },
          items: {
            include: {
              product: { select: { name: true, price: true } },
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        saleId,
        invoiceNumber: generateInvoiceNumber(saleId),
      },
      include: {
        sale: {
          include: {
            customer: true,
            user: { select: { fullName: true } },
            items: {
              include: {
                product: { select: { name: true, price: true } },
              },
            },
          },
        },
      },
    });
  }

  return invoice;
}
