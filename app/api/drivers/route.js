import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

// Create a new driver
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

    // ✅ Validate phone (only numbers allowed)
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


// Get all drivers
export async function GET(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where = { isDeleted: false, branchId: auth.branchId };

    const drivers = await prisma.deliveryDriver.findMany({
      where,
      include: { deliveries: true },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ success: true, data: drivers });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
