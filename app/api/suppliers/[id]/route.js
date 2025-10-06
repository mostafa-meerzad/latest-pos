import { updateSupplierSchema } from "@/app/services/supplierSchema";
import prisma from "@/lib/prisma";
import { STATUS } from "@/lib/status";
import { NextResponse } from "next/server";

export const GET = async (request, { params }) => {
  try {
    const { id } = await params;

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(id) },
      include: { products: true },
    });

    if (!supplier)
      return NextResponse.json(
        { success: false, error: "Supplier Not Found" },
        { status: 404 }
      );

    return NextResponse.json(
      { success: true, data: supplier },
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

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Request body cannot be empty" },
        { status: 400 }
      );
    }
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const validation = updateSupplierSchema.safeParse(body);
    if (!validation.success)
      return NextResponse.json(
        {
          success: false,
          error: validation.error.flatten(),
        },
        { status: 400 }
      );

    const { name, email, address, contactPerson, phone } = validation.data;

    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(id) },
      include: { products: true },
    });

    if (!supplier)
      return NextResponse.json(
        { success: false, error: "Supplier Not Found" },
        { status: 404 }
      );

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (contactPerson) updateData.phone = phone;

    const updateSupplier = await prisma.supplier.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return NextResponse.json(
      { success: true, data: updateSupplier },
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
    const { id } = await params;

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(id) },
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier Not Found" },
        { status: 404 }
      );
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: Number(id) },
      data: { status: STATUS.INACTIVE },
    });

    return NextResponse.json(
      { success: true, data: updatedSupplier },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
