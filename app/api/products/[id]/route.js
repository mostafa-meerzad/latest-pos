import { updateProductSchema } from "@/app/services/productSchema";
import prisma from "@/lib/prisma";
import { STATUS } from "@/lib/status";
import { NextResponse } from "next/server";

export const GET = async (request, { params }) => {
  try {
    const { id } = await params;

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id : Number(id) },
      include: { category: true, supplier: true },
    });

    if (!product)
      return NextResponse.json(
        { success: false, error: "Product Not Found" },
        { status: 404 }
      );

    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};

export const PUT = async (request, { params }) => {
  try {
    const { id } = await params;

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
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Product ID" },
        { status: 400 }
      );
    }

    const validation = updateProductSchema.safeParse(body);
    if (!validation.success)
      return NextResponse.json(
        {
          success: false,
          error: validation.error.flatten(),
        },
        { status: 400 }
      );

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

    // Ensure product exists
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });
    if (!product)
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );

    if (categoryId) {
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
    }

    if (supplierId) {
      //  Ensure supplier exists
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
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (costPrice) updateData.costPrice = costPrice;
    if (status) updateData.status = status;
    if (barcode) updateData.barcode = barcode;
    if (stockQuantity) updateData.stockQuantity = stockQuantity;
    if (expiryDate) updateData.expiryDate = expiryDate;

    const updateProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return NextResponse.json(
      { success: true, data: updateProduct },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};

export const DELETE = async (request, { params }) => {
  try {
    const { id } = await params;

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product Not Found" },
        { status: 404 }
      );
    }

    const deletedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: { isDeleted: true },
    });

    return NextResponse.json(
      { success: true, data: deletedProduct },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
