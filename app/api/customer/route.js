import { createCustomerSchema } from "@/lib/schemas/customer";
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
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: customers,
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

    const validation = createCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
        { status: 400 }
      );
    }

    let { name, email, address, phone } = validation.data;
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const branchId = auth.branchId || 1;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Customer name is required" },
        { status: 400 }
      );
    }

    if (name.toLowerCase() === "walk-in") {
      const count = await prisma.customer.count({
        where: {
          branchId: branchId,
          name: {
            startsWith: "Walk-in",
          },
        },
      });
      name = `Walk-in #${count + 1}`;
    }

    if (email) {
      const existing = await prisma.customer.findFirst({
        where: { email, branchId }
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Customer with given email already exists in this branch" },
          { status: 409 }
        );
      }
    }

    if (phone) {
      const existing = await prisma.customer.findFirst({
        where: { phone, branchId }
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: "Customer with given phone number already exists in this branch",
          },
          { status: 409 }
        );
      }
    }

    const newCustomer = await prisma.customer.create({
      data: { name, email, address, phone, branchId },
    });

    return NextResponse.json(
      { success: true, data: newCustomer },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
