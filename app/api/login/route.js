import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { buildSessionCookie, signSession } from "@/lib/auth";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Missing credentials" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signSession({ id: user.id, username: user.username, role: user.role?.name });
    const res = NextResponse.json({ success: true, user: { id: user.id, username: user.username, role: user.role?.name } });
    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
