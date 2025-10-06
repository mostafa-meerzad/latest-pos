import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getOrCreateWalkInCustomer } from "@/app/services/functions/customerService";
import { getAuthFromRequest } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { saleSchema } from "@/app/services/saleSchema";


export async function POST(req) {
  try {
    const session = await getAuthFromRequest(req);

    const body = await req.json();
    console.log('POST /api/sale body:', JSON.stringify(body, null, 2));

    const validation = saleSchema.safeParse(body);
    if (!validation.success) {
      console.error('Sale validation failed:', validation.error.flatten());
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
        { status: 400 }
      );
    }

    let {
      customerId,
      paymentMethod,
      taxAmount,
      items,
      totalAmount,
      discountAmount = 0,
    } = validation.data;

    // Ensure session exists
    if (!session || !session.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing session' },
        { status: 401 }
      );
    }
    const userId = session.id;

    // Coerce numeric values safely
    taxAmount = Number(taxAmount ?? 0);
    totalAmount = Number(totalAmount ?? 0);


    // ✅ Calculate total discount across items
      let totalDiscount = 0;
      for (const item of items) {
        const discountPerItem = Number(item.discount ?? 0);
        const qty = Number(item.quantity ?? 0);
        totalDiscount += discountPerItem * qty;
      }

     discountAmount = new Prisma.Decimal(totalDiscount.toString());

    const result = await prisma.$transaction(async (tx) => {
      // Handle walk-in if no customerId or invalid id
      if (!customerId) {
        const walkIn = await getOrCreateWalkInCustomer(tx); // ensure this helper exists and returns { id }
        customerId = walkIn.id;
      } else {
        const customer = await tx.customer.findUnique({
          where: { id: Number(customerId) },
        });
        if (!customer) {
          const walkIn = await getOrCreateWalkInCustomer(tx);
          customerId = walkIn.id;
        }
      }

      const newSale = await tx.sale.create({
        data: {
          userId: Number(userId),
          customerId: customerId ? Number(customerId) : null,
          paymentMethod,
          taxAmount,
          totalAmount,
          discountAmount,
        },
      });

      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice ?? 0);
        const discount = Number(item.discount ?? 0);
        const subtotal = Number(item.subtotal ?? unitPrice * quantity);

        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          // ApiError should be defined/imported; otherwise throw a normal error
          throw new ApiError(`Product with id ${productId} not found`, 404);
        }

        if (product.stockQuantity < quantity) {
          throw new ApiError(
            `Not enough stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${quantity}`,
            400
          );
        }

        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId,
            quantity,
            unitPrice,
            discount,
            subtotal,
          },
        });

        await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: product.stockQuantity - quantity,
          },
        });
      }

      return { newSale, customerId };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result.newSale,
          customerId: result.customerId,
          discountAmount: result.newSale.discountAmount,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    // IMPORTANT: print full error so we can see what actually happened
    console.error('Finalize sale failed — full error:', err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: err.errors },
        { status: 400 }
      );
    }

    if (typeof ApiError !== 'undefined' && err instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.status }
      );
    }

    // send the real error message for easier debugging (remove or mask in production)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to create sale' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { date: "desc" },
      include: {
        customer: true,
        user: { select: { id: true, username: true, fullName: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, barcode: true, price: true },
            },
          },
        },
        invoice: true,
        delivery: {
          include: { driver: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (err) {
    console.error("Failed to fetch sales:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}