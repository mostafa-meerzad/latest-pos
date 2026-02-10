import { createSupplierSchema } from "@/app/services/supplierSchema";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

export const GET = async (request) => {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where = { status: "ACTIVE", branchId: auth.branchId };

    const suppliers = await prisma.supplier.findMany({
      where,
      include: { products: true },
    });

    return NextResponse.json(
      { message: "success", data: suppliers },
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
