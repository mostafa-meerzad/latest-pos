import { createProductSchema } from "@/app/services/productSchema";
import prisma from "@/lib/prisma";
import { STATUS } from "@/lib/status";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const products = await prisma.product.findMany({
      where: {isDeleted: false},
      include: { category: true, supplier: true },
    });
    return NextResponse.json(
      { success: true, data: products },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = async (request) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Invalid or empty JSON payload" },
        { status: 400 }
      );
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Request body cannot be empty" },
        { status: 400 }
      );
    }

    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      price,
      costPrice,
      categoryId,
      status,
      barcode,
      stockQuantity,
      expiryDate,
      supplierId,
    } = validation.data;

    // Ensure category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found. Please create a category first.",
        },
        { status: 400 }
      );
    }

    await prisma.category.update({
      where: { id: categoryId },
      data: { status: STATUS.ACTIVE },
    });

    //  Ensure supplier exists
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return NextResponse.json(
          {
            success: false,
            error: "Supplier not found. Please create a supplier first.",
          },
          { status: 400 }
        );
      }

      await prisma.supplier.update({
        where: { id: supplierId },
        data: { status: STATUS.ACTIVE },
      });
    }

    // Check if product already exists
    let product = await prisma.product.findFirst({ where: { name } });
    // or by barcode
    if (barcode)
      product = await prisma.product.findUnique({
        where: { barcode: barcode },
      });
    if (product)
      return NextResponse.json(
        { success: false, error: "Product already exists" },
        { status: 409 }
      );

    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        costPrice,
        categoryId,
        status,
        barcode,
        stockQuantity,
        expiryDate: new Date(expiryDate),
        supplierId,
      },
    });

    return NextResponse.json(
      { success: true, data: newProduct },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
