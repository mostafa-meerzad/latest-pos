import { createCategorySchema } from "@/app/services/categorySchema";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

export const GET = async (request) => {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where = { is_deleted: false, branchId: auth.branchId };

    const categories = await prisma.category.findMany({
      where,
    });

    if (!categories)
      return NextResponse.json(
        { success: false, error: "No categories found" },
        { status: 404 }
      );

    return NextResponse.json(
      { success: true, data: categories },
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

    const validation = createCategorySchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          success: false,
          error:
            Object.values(errors).flat().join(", ") || "Invalid input data",
        },
        { status: 400 }
      );
    }

    const { name } = validation.data;
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const branchId = auth.branchId || 1;

    const category = await prisma.category.findFirst({ 
      where: { name: name, branchId: branchId } 
    });
    if (category)
      return NextResponse.json(
        { success: false, error: "Category already exist in this branch" },
        { status: 409 }
      );

    const newCategory = await prisma.category.create({ 
      data: { name, branchId: branchId } 
    });
    return NextResponse.json(
      { success: true, data: newCategory },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
