import { updateCategorySchema } from "@/app/services/categorySchema";
import prisma from "@/lib/prisma";
import { STATUS } from "@/lib/status";
import { NextResponse } from "next/server";

export const GET = async (request, { params }) => {
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

    return NextResponse.json(
      { success: true, data: category },
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

    const validation = updateCategorySchema.safeParse(body);
    if (!validation.success)
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
        { status: 400 }
      );

    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!category)
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );

    const { name } = validation.data;

    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: { name },
    });
    return NextResponse.json(
      { success: true, data: updatedCategory },
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
      data: { status: STATUS.INACTIVE },
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
