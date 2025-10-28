import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { z } from "zod";
import { saleSchema } from "@/app/services/saleSchema";
import { ApiError } from "@/lib/errors";

// ------------------------------
// 🟢 GET: Fetch sale details by ID
// ------------------------------
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const sale = await prisma.sale.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sale }, { status: 200 });
  } catch (error) {
    console.error("GET /api/sale/editSale/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch sale" },
      { status: 500 }
    );
  }
}



export async function PUT(req, { params }) {
  const { id } = await params;

  try {
    // ✅ Auth check
    const session = await getAuthFromRequest(req);
    if (!session || !session.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: missing session" },
        { status: 401 }
      );
    }

    // ✅ Parse & validate input
    const body = await req.json();
    const validation = saleSchema.safeParse(body);
    if (!validation.success) {
      console.error("Sale validation failed:", validation.error.flatten());
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
        { status: 400 }
      );
    }

    let {
      customerId,
      paymentMethod,
      taxAmount,
      totalAmount,
      items,
      discountAmount = 0,
    } = validation.data;

    const userId = Number(session.id);
    taxAmount = Number(taxAmount ?? 0);
    totalAmount = Number(totalAmount ?? 0);

    // ✅ Check sale existence
    const existingSale = await prisma.sale.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!existingSale) {
      throw new ApiError("Sale not found", 404);
    }

    // ✅ Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerId) },
    });

    if (!customer) {
      throw new ApiError("Customer not found", 404);
    }

    // ✅ Restore stock from old items
    for (const oldItem of existingSale.items) {
      await prisma.product.update({
        where: { id: oldItem.productId },
        data: { stockQuantity: { increment: oldItem.quantity } },
      });
    }

    // ✅ Validate stock before saving
    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = parseFloat(item.quantity);

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new ApiError(`Product with id ${productId} not found`, 404);
      }

      if (product.stockQuantity < quantity) {
        throw new ApiError(
          `Not enough stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${quantity}`,
          400
        );
      }
    }

    // ✅ Delete old items
    await prisma.saleItem.deleteMany({
      where: { saleId: Number(id) },
    });

    // ✅ Recalculate discount
    let totalDiscount = 0;
    for (const item of items) {
      const discountPerItem = Number(item.discount ?? 0);
      const qty = Number(item.quantity ?? 0);
      totalDiscount += discountPerItem * qty;
    }
    discountAmount = totalDiscount?.toString() || "0";

    // ✅ Update sale
    const updatedSale = await prisma.sale.update({
      where: { id: Number(id) },
      data: {
        userId,
        customerId: Number(customerId),
        paymentMethod,
        taxAmount,
        totalAmount,
        discountAmount,
      },
    });

    // ✅ Recreate items and decrement stock
    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = parseFloat(item.quantity);
      const unitPrice = Number(item.unitPrice ?? 0);
      const discount = Number(item.discount ?? 0);
      const subtotal = Number(item.subtotal ?? unitPrice * quantity);

      await prisma.saleItem.create({
        data: {
          saleId: updatedSale.id,
          productId,
          quantity,
          unitPrice,
          discount,
          subtotal,
        },
      });

      await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: { decrement: quantity } },
      });
    }

    return NextResponse.json(
      { success: true, data: updatedSale },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT /api/sale/editSale/[id] failed — full error:", err);

    // ✅ Match POST error structure exactly
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: err.errors },
        { status: 400 }
      );
    }

    if (typeof ApiError !== "undefined" && err instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.status }
      );
    }

    return NextResponse.json(
      { success: false, error: err?.message ?? "Failed to update sale" },
      { status: 500 }
    );
  }
}
