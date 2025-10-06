import { generateInvoice } from "@/app/services/functions/generateInvoice";
import { NextResponse } from "next/server";


export const POST = async (request, { params }) => {
  try {
    const saleId = Number(params.saleId);

    if (!saleId) {
      return NextResponse.json(
        { success: false, error: "Invalid saleId" },
        { status: 400 }
      );
    }

    const invoice = await generateInvoice(saleId);

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
