import { createCustomerSchema } from "@/app/services/customerSchema";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        sales: true, // include all sales for this customer
      },
    });

    // Map customers to include totalPurchases
    const customersWithTotals = customers.map((c) => {
      const totalPurchases = c.sales?.reduce(
        (sum, sale) => sum + Number(sale.finalAmount),
        0
      ) || 0;
      return {
        ...c,
        totalPurchases,
        sales: undefined, // optional: remove sales array if not needed in list
      };
    });

    return NextResponse.json(
      { success: true, data: customersWithTotals },
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

    // ✅ Validate input with Zod
    const validation = createCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
        { status: 400 }
      );
    }

    let { name, email, address, phone } = validation.data;

    // ✅ Ensure name is provided
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Customer name is required" },
        { status: 400 }
      );
    }

    // ✅ Handle "Walk-in" customers (case-insensitive)
    if (name.toLowerCase() === "walk-in") {
      const count = await prisma.customer.count({
        where: {
          name: {
            startsWith: "Walk-in",
          },
        },
      });
      name = `Walk-in #${count + 1}`;
    }

    // ✅ Check duplicates for email & phone
    if (email) {
      const existing = await prisma.customer.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Customer with given email already exists" },
          { status: 409 }
        );
      }
    }

    if (phone) {
      const existing = await prisma.customer.findUnique({ where: { phone } });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: "Customer with given phone number already exists",
          },
          { status: 409 }
        );
      }
    }

    // ✅ Create customer
    const newCustomer = await prisma.customer.create({
      data: { name, email, address, phone },
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
