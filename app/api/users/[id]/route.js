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

export async function PUT(req, { params }) {
  const id = parseInt(params.id);
  const body = await req.json();

  try {
    // If frontend sends role as name, convert it to roleId
    let roleId;
    if (body.role) {
      const role = await prisma.role.findUnique({
        where: { name: body.role },
      });
      if (!role) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      roleId = role.id;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username: body.username,
        fullName: body.fullName,
        status: body.status,
        ...(roleId && { roleId }), // only update role if provided
      },
      include: { role: true },
    });
console.log("sending response", { updatedUser });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

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
