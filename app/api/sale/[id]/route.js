import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await(params);

    const sale = await prisma.sale.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        user: { select: { id: true, username: true, fullName: true } },
        items: { include: { product: true } },
        invoice: true,
        delivery: { include: { driver: true } },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    if (auth.role !== "ADMIN" && sale.branchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Sale belongs to another branch" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (err) {
    console.error("Failed to fetch sale:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}
