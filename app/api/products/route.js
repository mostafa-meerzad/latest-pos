import { createProductSchema } from "@/app/services/productSchema";
import prisma from "@/lib/prisma";
import { STATUS } from "@/lib/status";
import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

export const GET = async (request) => {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const branchIdParam = searchParams.get("branchId");

    // Check if user is main branch
    const branch = await prisma.branch.findUnique({
      where: { id: auth.branchId },
      select: { isMain: true }
    });
    const isMain = branch?.isMain || false;

    let where = { isDeleted: false };

    if (isMain && branchIdParam) {
      if (branchIdParam === "all") {
        // No branch filter, show all products
      } else {
        where.branchId = parseInt(branchIdParam);
      }
    } else {
      // Non-main users or no param, filter by their branch
      where.branchId = auth.branchId;
    }

    const products = await prisma.product.findMany({
      where,
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
    // ✅ Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or empty JSON payload" },
        { status: 400 }
      );
    }

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Request body cannot be empty" },
        { status: 400 }
      );
    }

    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
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
      unit,
    } = validation.data;

    // ✅ Validate allowed unit values
    const validUnits = ["pcs", "kg"];
    if (!validUnits.includes(unit)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid unit value. Allowed values are: ${validUnits.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Ensure category exists and belongs to the same branch
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

    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const branchId = auth.branchId || 1;

    if (auth.role !== "ADMIN" && category.branchId !== branchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Category belongs to another branch",
        },
        { status: 403 }
      );
    }

    await prisma.category.update({
      where: { id: categoryId },
      data: { status: STATUS.ACTIVE },
    });

    // ✅ Ensure supplier exists and belongs to the same branch (if provided)
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

      if (auth.role !== "ADMIN" && supplier.branchId !== branchId) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Supplier belongs to another branch",
          },
          { status: 403 }
        );
      }

      await prisma.supplier.update({
        where: { id: supplierId },
        data: { status: STATUS.ACTIVE },
      });
    }

    // ✅ Prevent duplicate product (by name or barcode)
    const existingProduct = await prisma.product.findFirst({
      where: {
        branchId: branchId,
        OR: [{ name }, ...(barcode ? [{ barcode }] : [])],
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product already exists in this branch" },
        { status: 409 }
      );
    }

    // ✅ Create new product
    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        costPrice,
        categoryId,
        branchId,
        status,
        barcode,
        stockQuantity,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplierId,
        unit,
      },
    });

    return NextResponse.json(
      { success: true, data: newProduct },
      { status: 201 }
    );
  } catch (error) {
    // ✅ Handle Prisma unique constraint or other internal errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate product (unique constraint failed)",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
