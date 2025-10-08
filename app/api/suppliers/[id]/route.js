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

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

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

    // Use typeof !== 'undefined' so falsy-but-valid values (like empty strings) aren't skipped
    const updateData = {};
    if (typeof name !== "undefined") updateData.name = name;
    if (typeof email !== "undefined") updateData.email = email;
    if (typeof phone !== "undefined") updateData.phone = phone;
    if (typeof address !== "undefined") updateData.address = address;
    if (typeof contactPerson !== "undefined")
      updateData.contactPerson = contactPerson; 

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

    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!category)
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );

    const deletedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: { is_deleted: true },
    });

    return NextResponse.json(
      { success: true, data: deletedCategory },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
