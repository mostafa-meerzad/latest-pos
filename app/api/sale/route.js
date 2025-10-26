import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getOrCreateWalkInCustomer } from "@/app/services/functions/customerService";
import { getAuthFromRequest } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { saleSchema } from "@/app/services/saleSchema";

export async function POST(req) {
  try {
    const session = await getAuthFromRequest(req);
    if (!session || !session.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: missing session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    // console.log("POST /api/sale body:", JSON.stringify(body, null, 2));

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
      items,
      totalAmount,
      discountAmount = 0,
    } = validation.data;

    const userId = Number(session.id);
    taxAmount = Number(taxAmount ?? 0);
    totalAmount = Number(totalAmount ?? 0);

    // ✅ Calculate total discount
    let totalDiscount = 0;
    for (const item of items) {
      const discountPerItem = Number(item.discount ?? 0);
      const qty = Number(item.quantity ?? 0);
      totalDiscount += discountPerItem * qty;
    }
    discountAmount = totalDiscount?.toString() || "0";

    // ✅ Handle customer
    let customer = null;
    if (!customerId) {
      customer = await getOrCreateWalkInCustomer(prisma);
    } else {
      customer = await prisma.customer.findUnique({
        where: { id: Number(customerId) },
      });
      if (!customer) {
        customer = await getOrCreateWalkInCustomer(prisma);
      }
    }

    // ✅ VALIDATE STOCK BEFORE CREATING SALE
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

    // ✅ Create sale (only after all validations pass)
    const newSale = await prisma.sale.create({
      data: {
        userId,
        customerId: customer.id,
        paymentMethod,
        taxAmount,
        totalAmount,
        discountAmount,
      },
    });

    // ✅ Create items & update stock
    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = parseFloat(item.quantity);
      const unitPrice = Number(item.unitPrice ?? 0);
      const discount = Number(item.discount ?? 0);
      const subtotal = Number(item.subtotal ?? unitPrice * quantity);

      await prisma.saleItem.create({
        data: {
          saleId: newSale.id,
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
      {
        success: true,
        data: {
          ...newSale,
          customerId: customer.id,
          discountAmount: newSale.discountAmount,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Finalize sale failed — full error:", err);

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
      { success: false, error: err?.message ?? "Failed to create sale" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const payment = searchParams.get("payment") || "all";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // 🔍 Build Prisma where conditions
    const where = {};

    // payment filter
    if (payment !== "all") {
      where.paymentMethod = payment;
    }

    // search by sale ID or customer name - FIXED: removed mode parameter
    if (search && search.trim() !== "") {
      const searchNum = Number(search);
      const isNumber = !isNaN(searchNum) && searchNum > 0;

      where.OR = [
        // Search by customer name - removed mode: "insensitive"
        {
          customer: {
            name: {
              contains: search,
              // mode: "insensitive" // REMOVED - not supported in older Prisma
            },
          },
        },
      ];

      // Only add ID search if it's a valid positive number
      if (isNumber) {
        where.OR.push({ id: searchNum });
      }
    }

    // date filters
    if (fromDate) {
      where.date = { ...where.date, gte: new Date(fromDate) };
    }
    if (toDate) {
      where.date = { ...where.date, lte: new Date(`${toDate}T23:59:59.999`) };
    }

    // console.log("Where clause:", JSON.stringify(where, null, 2)); // Debug log

    // ✅ Get total count first (for pagination)
    const totalCount = await prisma.sale.count({ where });

    // ✅ Fetch paginated + filtered sales
    const sales = await prisma.sale.findMany({
      where,
      skip,
      take: limit,
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

    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    console.error("❌ Failed to fetch sales:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sales",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
