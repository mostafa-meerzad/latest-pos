import { createSupplierSchema } from "@/lib/schemas/supplier";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

export const GET = async (request) => {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";

    const where = { status: "ACTIVE", branchId: auth.branchId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: suppliers,
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

    const validation = createSupplierSchema.safeParse(body);

    if (!validation.success)
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
        { status: 400 }
      );

    const { name, email, address, contactPerson, phone } = validation.data;
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const branchId = auth.branchId || 1;

    const existingSupplier = await prisma.supplier.findFirst({
      where: { name: name, branchId: branchId },
    });

    if (existingSupplier)
      return NextResponse.json(
        { success: false, error: "supplier already exist in this branch" },
        { status: 409 }
      );

    const newSupplier = await prisma.supplier.create({
      data: { name, email, address, contactPerson, phone, branchId },
    });

    return NextResponse.json(
      { success: true, data: newSupplier },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
