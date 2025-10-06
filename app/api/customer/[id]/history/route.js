import { NextResponse } from "next/server";
import { getCustomerPurchaseHistory } from "@/app/services/functions/getCustomerPurchaseHistory";

export async function GET(request, { params }) {
  try {
    const history = await getCustomerPurchaseHistory(Number(params.id));
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
