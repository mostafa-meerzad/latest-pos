"use client";

import NewInvoice from "@/components/NewInvoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, User, Package, Truck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import { motion } from "framer-motion";

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
        console.log("Data from endpoint: "+ JSON.stringify(json.data));
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

  // ✅ Print Invoice (kept logic identical)
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${sale?.id || "print"}`,
    onAfterPrint: () => toast.success("Invoice printed successfully!"),
  });

  // Refund Sale (kept logic identical)
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

  // Small helper
  function formatDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("default", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(d);
    }
  }

  // 🟡 Skeleton Loader (styled to match ProductDetailClient)
  if (loading) {
    return (
      <motion.div
        className="p-6 max-w-3xl mx-auto mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="rounded-2xl border border-gray-100 drop-shadow-2xl">
          <CardContent className="p-8 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <Skeleton className="h-8 w-48 rounded-md" />
                <Skeleton className="h-4 w-64 mt-2 rounded-md" />
              </div>
              <Button variant="outline" disabled>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>

            {/* Sale Details */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Sale Details
              </h2>

              <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2 rounded-md" />
                    <Skeleton className="h-5 w-32 rounded-md" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Customer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-gray-400" />
                Customer
              </h2>
              <div className="bg-gray-100 rounded-xl p-4 space-y-2">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </motion.div>

            {/* Items */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-gray-400" />
                Items
              </h2>
              <div className="bg-gray-100 rounded-xl p-4 space-y-2 text-sm">
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-3 w-36 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
            </motion.div>

            {/* Delivery */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-gray-400" />
                Delivery
              </h2>
              <div className="bg-gray-100 rounded-xl p-4 space-y-2 text-sm">
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-3 w-36 rounded-md" />
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!sale) return <p className="p-6">Sale not found.</p>;

  // Destructure some commonly used fields for cleaner markup
  const {
    id: saleId,
    date,
    totalAmount,
    taxAmount,
    discountAmount,
    paymentMethod,
    customer,
    items,
    delivery,
  } = sale;

  return (
    <motion.div
      className="p-6 max-w-3xl mx-auto mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="rounded-2xl border border-gray-100 drop-shadow-2xl">
        <CardContent className="p-8 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Sale #{saleId}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{formatDate(date)}</p>
            </div>

            <motion.div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className={"bg-green-300 hover:bg-green-200 text-sm"}
                >
                  Print Invoice
                </Button>
                <Button variant="outline" onClick={() => router.push("/sales")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </motion.div>
          </div>

          {/* ===== Sale Details ===== */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.25 }}
          >
            <Section
              title="Sale Details"
              icon={<FileText className="w-5 h-5 text-gray-500" />}
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Detail label="Total" value={`${totalAmount} AFG`} />
                <Detail label="Payment" value={paymentMethod || "—"} />
                <Detail label="Tax" value={`${taxAmount ?? 0} AFG`} />
                <Detail label="Discount" value={`${discountAmount ?? 0} AFG`} />
              </div>
            </Section>

            {/* ===== Customer ===== */}
            <Section
              title="Customer"
              icon={<User className="w-5 h-5 text-gray-500" />}
            >
              {customer ? (
                <div className="bg-gray-100 rounded-xl p-4 space-y-1 text-sm">
                  <p className="font-medium text-gray-800 text-lg">
                    {customer.name}
                  </p>
                  {customer.phone && (
                    <p className="text-gray-500">
                      Phone:{" "}
                      <span className="text-[1rem] text-gray-800 font-semibold">
                        {customer.phone}
                      </span>
                    </p>
                  )}
                  {customer.address && (
                    <p className="text-gray-500">
                      Address:{" "}
                      <span className="text-[1rem] text-gray-800 font-semibold">
                        {customer.address}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No customer info</p>
              )}
            </Section>

            {/* ===== Items ===== */}
            <Section
              title="Items"
              icon={<Package className="w-5 h-5 text-gray-500" />}
            >
              <div className="bg-gray-100 rounded-xl p-4 text-sm space-y-2">
                {items && items.length > 0 ? (
                  items.map((it) => (
                    <div
                      key={it.id}
                      className="flex justify-between items-start"
                    >
                      <div>
                        <div className="font-medium">
                          {it.product?.name ?? "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Qty: {it.quantity}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        AFG {it.subtotal}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No items</p>
                )}
              </div>
            </Section>

            {/* ===== Delivery ===== */}
            <Section
              title="Delivery"
              icon={<Truck className="w-5 h-5 text-gray-500" />}
            >
              {delivery ? (
                <div className="bg-gray-100 rounded-xl p-4 text-sm space-y-1">
                  <p className="font-medium">{delivery.deliveryAddress}</p>
                  <p className="text-gray-500">
                    Driver:{" "}
                    <span className="text-[1rem] text-gray-800 font-semibold">
                      {delivery.driver?.name ?? "—"}
                    </span>
                  </p>
                  <p className="text-gray-500">
                    Fee:{" "}
                    <span className="text-[1rem] text-gray-800 font-semibold">
                      {delivery.deliveryFee ?? "—"}
                    </span>
                  </p>
                  <p className="text-gray-500">
                    Status:{" "}
                    <span className="text-[1rem] text-gray-800 font-semibold">
                      {delivery.status ?? "—"}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No delivery</p>
              )}
            </Section>

            {/* Refund action */}
            <div className="pt-2">
              <Button
                className={
                  "bg-red-400 text-white hover:bg-red-300 hover:text-red-800"
                }
                variant="outline"
                onClick={() => handleRefund(saleId)}
              >
                Refund Sale
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Hidden Invoice for printing (kept identical) */}
      <div style={{ display: "none" }}>
        <NewInvoice ref={invoiceRef} sale={sale} />
      </div>
    </motion.div>
  );
}

/* Small sub-component for clean detail rows */
function Detail({ label, value }) {
  return (
    <div className="flex gap-2 items-center">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium text-[1rem]">{value}</div>
    </div>
  );
}

/* Generic section wrapper with icon + title */
function Section({ title, icon, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}
