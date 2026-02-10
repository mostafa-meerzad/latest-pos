import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

// Create a new delivery
export async function POST(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const branchId = auth.branchId || 1;

    const body = await request.json();
    const {
      saleId,
      customerId,
      deliveryAddress,
      driverId,
      deliveryDate,
      deliveryFee, 
      customerPhone,
    } = body;

    console.log("the delivery data i get from frontend: ", body)

    // Required fields validation
    if (!saleId || !customerId || !deliveryAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "saleId, customerId, and deliveryAddress are required",
        },
        { status: 400 }
      );
    }

    // Ensure deliveryFee is valid
    if (deliveryFee === undefined || deliveryFee < 0) {
      return NextResponse.json(
        { success: false, error: "deliveryFee must be provided and non-negative" },
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

    // Ensure sale belongs to the same branch
    if (existingSale.branchId !== branchId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Sale belongs to another branch" },
        { status: 403 }
      );
    }

    // Ensure customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Ensure driver belongs to the same branch (if provided)
    if (driverId) {
      const driver = await prisma.deliveryDriver.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        return NextResponse.json(
          { success: false, error: "Driver not found" },
          { status: 404 }
        );
      }

      if (driver.branchId !== branchId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Driver belongs to another branch" },
          { status: 403 }
        );
      }
    }

    const delivery = await prisma.delivery.create({
      data: {
        saleId,
        customerId,
        branchId,
        deliveryAddress,
        driverId: driverId || null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryFee, 
        customerPhone: customerPhone || null,
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

// Get all deliveries with pagination and filtering
export async function GET(req) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const driver = searchParams.get("driver") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "6");

    const skip = (page - 1) * limit;

    // Build where conditions
    const where = { deleted: false, branchId: auth.branchId };

    // Status filter
    if (status !== "all") {
      where.status = status;
    }

    // Driver filter
    if (driver !== "all") {
      where.driverId = parseInt(driver);
    }

    // Search filter
    if (search) {
      const searchNum = Number(search);
      const isNumber = !isNaN(searchNum) && searchNum > 0;
      
      where.OR = [
        // Search by customer name
        {
          customer: {
            name: {
              contains: search,
            },
          },
        },
        // Search by delivery address
        {
          deliveryAddress: {
            contains: search,
          },
        },
      ];

      // Search by delivery ID if it's a valid number
      if (isNumber) {
        where.OR.push({ id: searchNum });
      }

      // Search by customer phone
      where.OR.push({
        customerPhone: {
          contains: search,
        },
      });
    }

    // Get total count for pagination
    const totalCount = await prisma.delivery.count({ where });

    // Fetch paginated deliveries
    const deliveries = await prisma.delivery.findMany({
      where,
      skip,
      take: limit,
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

    return NextResponse.json({ 
      success: true, 
      data: deliveries,
      pagination: {
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      }
    });
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
