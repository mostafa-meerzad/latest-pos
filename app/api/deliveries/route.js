import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // make sure this points to your prisma client

// Create a new delivery
export async function POST(request) {
  try {
    const body = await request.json();
    const { saleId, customerId, deliveryAddress, driverId, deliveryDate } =
      body;

    if (!saleId || !customerId || !deliveryAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "saleId, customerId, and deliveryAddress are required",
        },
        { status: 400 }
      );
    }

    // Ensure Sale exists and has no delivery yet
    const existingSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { delivery: true },
    });

    if (!existingSale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    if (existingSale.delivery) {
      return NextResponse.json(
        { success: false, error: "Delivery already exists for this sale" },
        { status: 400 }
      );
    }

    const delivery = await prisma.delivery.create({
      data: {
        saleId,
        customerId,
        deliveryAddress,
        driverId: driverId || null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      },
      include: {
        sale: true,
        customer: true,
        driver: true,
      },
    });

    return NextResponse.json(
      { success: true, data: delivery },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating delivery:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all deliveries
export async function GET() {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: { deleted: false },
      include: {
        sale: {
          include: {
            items: { include: { product: true } },
          },
        },
        customer: true,
        driver: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ success: true, data: deliveries });
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
