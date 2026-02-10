import { createUserSchema } from "@/app/services/userSchema";
import { hashPassword, getAuthFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async (request) => {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where = { status: "ACTIVE" };
    
    // Check if user belongs to main branch
    const currentUser = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { branch: true }
    });

    if (auth.role !== "ADMIN" || !currentUser?.branch?.isMain) {
      where.branchId = auth.branchId;
    }

    const users = await prisma.user.findMany({
      where,
      include: { role: true, branch: true },
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

    // console.log("Body before validation:", body);
    const validation = createUserSchema.safeParse(body);
    // console.log("Validation result:", validation);

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

    const { username, password, fullName, role, branchId } = validation.data;

    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if user belongs to main branch
    const currentUser = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { branch: true }
    });

    const isMainBranchAdmin = auth.role === "ADMIN" && currentUser?.branch?.isMain;

    // Use branchId from body if provided and user is main branch ADMIN, otherwise use auth.branchId
    const targetBranchId = isMainBranchAdmin && branchId ? branchId : (auth.branchId || 1);

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
        branchId: targetBranchId,
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
