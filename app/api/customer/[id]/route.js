import { updateCustomerSchema } from "@/app/services/customerSchema";
import prisma from "@/lib/prisma";
import { STATUS } from "@/lib/status";
import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

export const GET = async (request, { params }) => {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });
    if (!customer)
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );

    if (auth.role !== "ADMIN" && customer.branchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Customer belongs to another branch" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, data: customer },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};

export const PUT = async (request, { params }) => {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Invalid or empty JSON payload" },
        { status: 400 }
      );
    }

    const validation = updateCustomerSchema.safeParse(body);
    if (!validation.success){
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, address, phone } = validation.data;

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });
    if (!customer)
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );

    if (auth.role !== "ADMIN" && customer.branchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Customer belongs to another branch" },
        { status: 403 }
      );
    }

    const updateData = {};
    if (name) updateData.name = name; 
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const updatedCustomer = await prisma.customer.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return NextResponse.json(
      { success: true, data: updatedCustomer },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};

export const DELETE = async (request, { params }) => {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });
    if (!customer)
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );

    if (auth.role !== "ADMIN" && customer.branchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Customer belongs to another branch" },
        { status: 403 }
      );
    }

    const deletedCustomer = await prisma.customer.update({
      where: { id: Number(id) },
      data: { status: STATUS.INACTIVE },
    });
    return NextResponse.json(
      { success: true, data: deletedCustomer },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
