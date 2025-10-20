import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookie = cookieHeader
      .split(/;\s*/)
      .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
    const jwtToken = cookie
      ? decodeURIComponent(cookie.split("=")[1] || "")
      : null;
    const token = jwtToken ? await verifySessionToken(jwtToken) : null;

    return NextResponse.json({
      success: true,
      data: { userName: token.username || null, role: token.role || null },
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
