import { createProductSchema } from "@/lib/schemas/product";
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || "";
    const stock = searchParams.get("stock") || "";
    const sortBy = searchParams.get("sortBy") || "id";

    const branch = await prisma.branch.findUnique({
      where: { id: auth.branchId },
      select: { isMain: true },
    });
    const isMain = branch?.isMain || false;

    const where = { isDeleted: false };

    if (isMain && branchIdParam) {
      if (branchIdParam !== "all") where.branchId = parseInt(branchIdParam);
    } else {
      where.branchId = auth.branchId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (categoryId) where.categoryId = parseInt(categoryId);
    if (status === "ACTIVE" || status === "INACTIVE") where.status = status;
    if (stock === "in") where.stockQuantity = { gt: 0 };
    if (stock === "out") where.stockQuantity = { lte: 0 };

    const orderBy = sortBy === "stock" ? { stockQuantity: "desc" } : { id: "asc" };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, supplier: true },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
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
