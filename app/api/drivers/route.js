import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

export async function POST(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const branchId = auth.branchId || 1;

    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Name and phone are required" },
        { status: 400 }
      );
    }

    if (!/^[0-9]+$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Phone number must contain only digits" },
        { status: 400 }
      );
    }

    const existingDriver = await prisma.deliveryDriver.findFirst({
      where: { phone, branchId },
    });

    if (existingDriver) {
      return NextResponse.json(
        { success: false, error: "Driver with this phone already exists in this branch" },
        { status: 400 }
      );
    }

    const driver = await prisma.deliveryDriver.create({
      data: { name, phone, branchId },
    });

    return NextResponse.json({ success: true, data: driver }, { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";

    const where = { isDeleted: false, branchId: auth.branchId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;
    const [drivers, total] = await Promise.all([
      prisma.deliveryDriver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.deliveryDriver.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: drivers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
