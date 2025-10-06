import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Update driver
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, phone } = body;

    const driver = await prisma.deliveryDriver.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
      },
    });

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      { success: false, error: "Driver not found or internal error" },
      { status: 500 }
    );
  }
}

// DELETE /api/drivers/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const driver = await prisma.deliveryDriver.update({
      where: { id: Number(id) },
      data: { isDeleted: true }, 
    });

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

