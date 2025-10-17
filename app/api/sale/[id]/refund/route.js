import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { ApiError } from "@/lib/errors";

/**
 * POST /api/sale/:id/refund
 * Performs a full refund (delete sale, restore product quantities, delete invoice, soft-delete delivery).
 */
export async function POST(req, { params }) {
  try {
    const session = await getAuthFromRequest(req);
    if (!session || !session.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: missing session" },
        { status: 401 }
      );
    }

    const saleId = Number(params.id);
    if (!saleId || isNaN(saleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid sale id" },
        { status: 400 }
      );
    }

    // Fetch sale with items, delivery and invoice
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
        delivery: true,
        invoice: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });
    }

    // Build map productId -> qty to restore
    const qtyByProduct = new Map();
    for (const item of sale.items) {
      const pid = item.productId;
      const q = Number(item.quantity ?? 0);
      qtyByProduct.set(pid, (qtyByProduct.get(pid) || 0) + q);
    }

    // Transaction: restore product stocks, delete sale items, invoice, soft-delete delivery, delete sale
    await prisma.$transaction(async (tx) => {
      // 1) Update product quantities
      for (const [productId, qty] of qtyByProduct.entries()) {
        // Ensure product exists
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
          // If a product is missing, abort
          throw new ApiError(`Product with id ${productId} not found while refunding.`, 500);
        }

        await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: { increment: qty } },
        });
      }

      // 2) Delete sale items
      await tx.saleItem.deleteMany({ where: { saleId } });

      // 3) Soft-delete delivery if exists (your deliveries use `deleted: Boolean`)
      if (sale.delivery) {
        await tx.delivery.update({
          where: { id: sale.delivery.id },
          data: { deleted: true },
        });
      }

      // 4) Delete invoice if exists
      if (sale.invoice) {
        await tx.invoice.delete({ where: { id: sale.invoice.id } });
      }

      // 5) Finally delete sale record
      await tx.sale.delete({ where: { id: saleId } });
    });

    return NextResponse.json({
      success: true,
      message: `Sale #${saleId} refunded: stock restored, related delivery/invoice removed.`,
    });
  } catch (err) {
    console.error("Refund failed:", err);

    if (typeof ApiError !== "undefined" && err instanceof ApiError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }

    return NextResponse.json(
      { success: false, error: err?.message ?? "Failed to refund sale" },
      { status: 500 }
    );
  }
}
