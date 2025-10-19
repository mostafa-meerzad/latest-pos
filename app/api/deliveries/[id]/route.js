import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Update delivery (status, driver, deliveryDate, address, or deliveryFee)
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      status,
      driverId,
      deliveryDate,
      deliveryAddress,
      deliveryFee, // ✅ NEW FIELD
      customerPhone,
    } = body;

    // Only allow valid statuses
    const allowedStatuses = ["pending", "delivered", "canceled"];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Validate deliveryFee if provided
    if (deliveryFee !== undefined && deliveryFee < 0) {
      return NextResponse.json(
        { success: false, error: "deliveryFee must be non-negative" },
        { status: 400 }
      );
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: Number(id) },
      data: {
        ...(status && { status }),
        ...(driverId !== undefined && { driverId }),
        ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
        ...(deliveryAddress !== undefined && { deliveryAddress }),
        ...(deliveryFee !== undefined && { deliveryFee }), // ✅ ADDED
        ...(customerPhone !== undefined && { customerPhone }), // ✅ ADDED
      },
      include: {
        sale: true,
        customer: true,
        driver: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedDelivery });
  } catch (error) {
    console.error("Error updating delivery:", error);
    return NextResponse.json(
      { success: false, error: "Delivery not found or internal error" },
      { status: 500 }
    );
  }
}

// Soft delete delivery
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(id) },
    });

    if (!delivery) {
      return NextResponse.json(
        { success: false, error: "Delivery not found" },
        { status: 404 }
      );
    }

    const deletedDelivery = await prisma.delivery.update({
      where: { id: Number(id) },
      data: { deleted: true },
    });

    return NextResponse.json({
      success: true,
      message: "Delivery deleted successfully",
      data: deletedDelivery,
    });
  } catch (error) {
    console.error("Error deleting delivery:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
