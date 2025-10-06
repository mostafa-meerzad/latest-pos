// NextAuth has been removed in favor of custom credentials auth.
// This route is intentionally disabled.
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export function POST() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}
