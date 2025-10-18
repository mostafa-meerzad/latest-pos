"use client";

import NewInvoice from "@/components/NewInvoice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

export default function SaleDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef();

  useEffect(() => {
    if (!id) return;
    const fetchSale = async () => {
      try {
        const res = await fetch(`/api/sale/${id}`);
        const json = await res.json();
        if (json.success) {
          setSale(json.data);
        } else {
          toast.error("Failed to load sale details.");
        }
      } catch (err) {
        console.error("Error fetching sale:", err);
        toast.error("Error fetching sale details.");
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id]);

  // ✅ Print Invoice
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${sale?.id || "print"}`,
    onAfterPrint: () => toast.success("Invoice printed successfully!"),
  });

  // Refund Sale
  async function handleRefund(saleId) {
    const toastId = toast.custom((t) => (
      <div
        className={`bg-white p-4 rounded-lg shadow-md border flex flex-col gap-3 transition-all ${
          t.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-sm font-semibold text-gray-700">
          Are you sure you want to refund sale <b>#{saleId}</b>?
          <br />
          This will delete the sale and restore item stocks.
        </p>
        <div className="flex justify-end gap-2 pt-3">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performRefund(saleId);
            }}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-md"
          >
            Yes, refund
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1.5 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    ));

    // inner function that actually performs the refund
    async function performRefund(saleId) {
      const loadingId = toast.loading("Processing refund...");

      try {
        const res = await fetch(`/api/sale/${saleId}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        toast.dismiss(loadingId);

        if (res.ok && data.success) {
          toast.success("Sale refunded successfully!");
          setTimeout(() => router.push("/sales"), 1500);
        } else {
          toast.error(data.error || "Refund failed. Please try again.");
          console.error("Refund failed:", data);
        }
      } catch (err) {
        toast.dismiss(loadingId);
        console.error("Refund request failed:", err);
        toast.error("Refund request failed.");
      }
    }
  }
  if (loading) return <SaleDetailsSkeleton />;
  if (!sale) return <p className="p-6">Sale not found.</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sale #{sale.id}</h1>
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            className={"bg-green-300 hover:bg-green-200 text-sm"}
          >
            Print Invoice
          </Button>
          <Link href="/sales">
            <Button variant="outline">Back to Sales</Button>
          </Link>
        </div>
      </div>

      <Card className="min-w-2/3 drop-shadow-xl">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sale Details</h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  {new Date(sale.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{sale.invoice?.invoiceNumber || "-"}</TableCell>
                <TableCell>
                  {sale.totalAmount} AFG{" "}
                  <span className="text-xs text-gray-500">
                    (Tax {sale.taxAmount}, Disc {sale.discountAmount})
                  </span>
                </TableCell>
                <TableCell>{sale.paymentMethod}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{sale.customer?.name}</p>
                    {sale.customer?.phone && (
                      <p className="text-xs text-gray-500">
                        {sale.customer.phone}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {sale.items.map((i) => (
                    <div key={i.id} className="text-sm">
                      {i.product?.name} × {i.quantity} = AFG{i.subtotal}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  {console.log("delivery data: ", sale.delivery)}
                  {sale.delivery ? (
                    <div className="text-sm">
                      <p>{sale.delivery.deliveryAddress}</p>
                      <p className="text-gray-500">
                        Driver: {sale.delivery.driver?.name}
                      </p>
                      <p className="text-gray-500">
                        Driver: {sale.delivery.deliveryFee}
                      </p>
                      <p>Status: {sale.delivery.status}</p>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    className={
                      "bg-red-400 text-white hover:bg-red-300 hover:text-red-800"
                    }
                    variant="outline"
                    onClick={() => handleRefund(sale.id)}
                  >
                    Refund Sale
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Hidden Invoice for printing */}
      <div style={{ display: "none" }}>
        <NewInvoice ref={invoiceRef} sale={sale} />
      </div>
    </div>
  );
}

function SaleDetailsSkeleton() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-10 w-32 rounded-md" /> {/* Buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md" /> {/* Buttons */}
          <Skeleton className="h-10 w-32 rounded-md" /> {/* Buttons */}
        </div>
      </div>
      <Card className="p-8">
        {/* <h2 className="text-2xl font-bold">Sale Details</h2> */}
        <Skeleton className="w-20 h-8" />
        <div className="">
          <div className="grid grid-cols-7 gap-4 py-3 text-sm font-medium text-gray-600">
            <Skeleton className="h-4 w-16" /> {/* Header */}
            <Skeleton className="h-4 w-16" /> {/* Header */}
            <Skeleton className="h-4 w-16" /> {/* Header */}
            <Skeleton className="h-4 w-16" /> {/* Header */}
            <Skeleton className="h-4 w-16" /> {/* Header */}
            <Skeleton className="h-4 w-16" /> {/* Header */}
          </div>
          <div className="border-t pt-3 pt-10">
            <div className="grid grid-cols-7 gap-4 items-start">
              <Skeleton className="h-4 w-20" /> {/* Date */}
              <Skeleton className="h-4 w-10" /> {/* Invoice */}
              <Skeleton className="h-4 w-24" /> {/* Amount */}
              <Skeleton className="h-4 w-16" /> {/* Payment */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" /> {/* Name */}
                <Skeleton className="h-3 w-20" /> {/* Phone */}
              </div>
              <Skeleton className="h-4 w-40" /> {/* Items */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" /> {/* Address */}
                <Skeleton className="h-3 w-32" /> {/* Driver info */}
              </div>
            </div>
          </div>
          <div className=" pt-3 mt-4 ">
            <div className="grid grid-cols-7 gap-4 items-start">
              <Skeleton className="h-4 w-20" /> {/* Date */}
              <Skeleton className="h-4 w-10" /> {/* Invoice */}
              <Skeleton className="h-4 w-24" /> {/* Amount */}
              <Skeleton className="h-4 w-16" /> {/* Payment */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" /> {/* Name */}
                <Skeleton className="h-3 w-20" /> {/* Phone */}
              </div>
              <Skeleton className="h-4 w-40" /> {/* Items */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" /> {/* Address */}
                <Skeleton className="h-3 w-32" /> {/* Driver info */}
              </div>
            </div>
          </div>
          <div className=" pt-3 mt-4 ">
            <div className="grid grid-cols-7 gap-4 items-start">
              <Skeleton className="h-4 w-20" /> {/* Date */}
              <Skeleton className="h-4 w-10" /> {/* Invoice */}
              <Skeleton className="h-4 w-24" /> {/* Amount */}
              <Skeleton className="h-4 w-16" /> {/* Payment */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" /> {/* Name */}
                <Skeleton className="h-3 w-20" /> {/* Phone */}
              </div>
              <Skeleton className="h-4 w-40" /> {/* Items */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" /> {/* Address */}
                <Skeleton className="h-3 w-32" /> {/* Driver info */}
              </div>
            </div>

            {/* <div className="flex justify-end mt-6"> */}
            {/* <Skeleton className="h-10 w-28 rounded-md" />{" "} */}
            {/* Refund button */}
            {/* </div> */}
          </div>
        </div>
      </Card>
    </div>
  );
}
