"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import salesImage from "@/assets/sales_img.png";
import { toast } from "react-hot-toast";

export default function SaleHeader({
  isEditMode,
  editSaleId,
  isSubmitting,
  isOffline,
  onFinalizeSale,
  onFinalizeSaleWithDelivery,
  onPrint,
  onPrintDelivery,
  onClearCart,
  onReset,
}) {
  async function handleClear() {
    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <p>Are you sure you want to clear the cart?</p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => { toast.dismiss(t.id); resolve(true); }}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Yes, clear
              </Button>
              <Button
                onClick={() => { toast.dismiss(t.id); resolve(false); }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ),
        { duration: Infinity, position: "top-center" }
      );
    });

    if (confirmed) {
      onClearCart();
      toast.success("Cart cleared");
    }
  }

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold flex items-center gap-2 w-fit text-nowrap">
        <Image src={salesImage} width={80} height={80} alt="sales" />
        {isEditMode ? `Edit Sale #${editSaleId}` : "New Sale"}
      </h1>

      <div className="flex gap-2 max-2xl:flex-wrap max-2xl:justify-end">
        <Button
          variant="secondary"
          className="bg-red-500 text-white text-md hover:bg-red-400"
          onClick={handleClear}
        >
          Clear Cart
        </Button>
        <Button
          onClick={onFinalizeSale}
          className="bg-green-500 text-md hover:bg-green-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Finalize Sale"}
        </Button>
        <Button
          onClick={onFinalizeSaleWithDelivery}
         
          disabled={isSubmitting || isEditMode || isOffline}
          title={isOffline ? "Delivery requires a connection" : undefined}
        >
          {isSubmitting ? "Saving..." : "Finalize Sale + Delivery"}
        </Button>
        <Button
          onClick={onPrint}
          className="bg-blue-500 text-md hover:bg-blue-400"
          disabled={isEditMode}
        >
          Print Invoice
        </Button>
        <Button
          onClick={onPrintDelivery}
          className="bg-cyan-400 text-md hover:bg-cyan-300"
          disabled={isEditMode}
        >
          Print Delivery
        </Button>
        <Link href="/sales">
          <Button variant="outline" onClick={onReset}>
            Back to Sales
          </Button>
        </Link>
      </div>
    </div>
  );
}
