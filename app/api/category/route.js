import { createCategorySchema } from "@/app/services/categorySchema";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const categories = await prisma.category.findMany();

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
    if (!validation.success)
      return NextResponse.json(
        { success: false, error: validation.error.flatten() },
        { status: 400 }
      );

    const { name } = validation.data;

    const category = await prisma.category.findFirst({ where: {name: name} });
    if (category)
      return NextResponse.json(
        { success: false, error: "Category already exist" },
        { status: 409 }
      );

    const newCategory = await prisma.category.create({ data: { name } });
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
