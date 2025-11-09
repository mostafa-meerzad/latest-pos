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
      where: { id: Number(id) },
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

    if (body.barcode === '') {
      body.barcode = null;
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
      unit,
    } = validation.data;

    // Ensure product exists - using the correct field name
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });
    if (!product)
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );

    const updateData = {};

    // Handle categoryId validation and update
    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === "") {
        // Allow clearing the category
        updateData.categoryId = null;
      } else {
        // Ensure category exists - using the correct field name from your schema
        const category = await prisma.category.findUnique({
          where: { id: Number(categoryId) }, // Use 'id' because of @map("category_id")
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
        updateData.categoryId = Number(categoryId);
      }
    }

    // Add other fields - using the correct field names from your schema
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (costPrice !== undefined) updateData.costPrice = costPrice;
    if (status !== undefined) updateData.status = status;
       if (barcode !== undefined && barcode !== "") updateData.barcode = barcode;
    if (stockQuantity !== undefined)
      updateData.stockQuantity = Number(stockQuantity);
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (unit !== undefined) {
      const allowedUnits = ["pcs", "kg"];
      if (!allowedUnits.includes(unit)) {
        return NextResponse.json(
          { success: false, error: "Invalid unit. Allowed values: pcs or kg." },
          { status: 400 }
        );
      }
      updateData.unit = unit;
    }

    const updateProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        category: true,
        supplier: true,
      },
    });

    return NextResponse.json(
      { success: true, data: updateProduct },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating product:", error);
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
