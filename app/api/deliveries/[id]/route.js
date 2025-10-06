import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Update delivery (status, driver, deliveryDate, or address)
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, driverId, deliveryDate, deliveryAddress } = body;

    // Only allow valid statuses
    const allowedStatuses = ["pending", "dispatched", "delivered", "canceled"];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: Number(id) },
      data: {
        ...(status && { status }),
        ...(driverId !== undefined && { driverId }),
        ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
        ...(deliveryAddress !== undefined && { deliveryAddress }), // ✅ added
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

    // Check if delivery exists
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(id) },
    });

    if (!delivery) {
      return NextResponse.json(
        { success: false, error: "Delivery not found" },
        { status: 404 }
      );
    }

    // Soft delete by updating "deleted"
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
