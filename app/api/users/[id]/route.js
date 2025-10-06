import { updateUserSchema } from "@/app/services/userSchema";
import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { STATUS } from "@/lib/status";
import { NextResponse } from "next/server";

export const GET = async (request, { params }) => {
  try {
    const { id } = await params;
    const user = await prisma.user.findFirst({
      where: { id: Number(id) },
      include: { role: true },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
};

export const PUT = async (request, { params }) => {
  try {
    const { id } = await params;

    console.log("put user")
    console.log("user id", id)

    const user = await prisma.user.findFirst({
      where: { id: Number(id) },
    });
    console.log("user ", user)
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid or empty JSON payload" },
        { status: 400 }
      );
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Request body cannot be empty" },
        { status: 400 }
      );
    }

    const validation = updateUserSchema.safeParse(body);
    console.log("validation", validation.data)
    if (!validation.success)
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );

    const { username, password, fullName, status, role, roleId } = validation.data;

    // let roleId;
    // if (role) {
    //   const dbRole = await prisma.role.findFirst({ where: { name: role } });
    //   if (!dbRole) {
    //     return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    //   }
    //   roleId = dbRole.id;
    // }

    console.log("role id ", roleId)

    const updateData = {};
    if (username) updateData.username = username;
    if (fullName) updateData.fullName = fullName;
    if (status) updateData.status = status;
    if (roleId) updateData.roleId = Number(roleId);
    if (password) updateData.password = await hashPassword(password);

    console.log("update data", updateData)

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      include: { role: true },
      data: updateData,
    });
    console.log("updated user ", updatedUser)

    return NextResponse.json({ updatedUser });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
};

export const DELETE = async (request, { params }) => {
  try {
    const { id } = params;
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user)
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });

    const deletedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: STATUS.INACTIVE },
    });

    return NextResponse.json({ message: "User deactivated", deletedUser });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
};
