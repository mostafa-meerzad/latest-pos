import { NextResponse } from "next/server";
import { getCustomerPurchaseHistory } from "@/app/services/functions/getCustomerPurchaseHistory";

import { getAuthFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const customerId = Number(id);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    if (auth.role !== "ADMIN" && customer.branchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Customer belongs to another branch" },
        { status: 403 }
      );
    }

    const history = await getCustomerPurchaseHistory(customerId);
    if (!history) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: history }, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer history:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
