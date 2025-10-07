import { createUserSchema } from "@/app/services/userSchema";
import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      include: { role: true },
    });
    return NextResponse.json({ success: true, data: users }, { status: 200 });
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

    // ✅ Validate with Zod

    console.log("Body before validation:", body);
    const validation = createUserSchema.safeParse(body);
    console.log("Validation result:", validation);

    if (!validation.success) {
      const errors = validation.error?.errors;

      // Handle case if errors array doesn't exist
      const errorMessages = Array.isArray(errors)
        ? errors.map((err) => `${err.path.join(".")}: ${err.message}`)
        : ["Invalid input data"];

      return NextResponse.json(
        {
          success: false,
          error: errorMessages.join(", "),
          details: errors || validation.error, // optional full info
        },
        { status: 400 }
      );
    }

    const { username, password, fullName, role } = validation.data;

    const user = await prisma.user.findFirst({ where: { username } });
    if (user)
      return NextResponse.json(
        { success: false, error: "Username already in use" },
        { status: 409 }
      );

    const dbRole = await prisma.role.findFirst({ where: { name: role } });

    if (!dbRole)
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 400 }
      );

    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        username,
        fullName,
        password: hashedPassword,
        roleId: dbRole.id,
      },
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
