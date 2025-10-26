"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Package, Tag, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailClient({ id }) {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json?.error || "Failed to fetch");
        setProduct(json.data);
        // toast.success("Product details loaded successfully");
      } catch (err) {
        setError(err.message);
        toast.error(err.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

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

  // 🟡 Skeleton Loader
  if (loading) {
    return (
      <motion.div
        className="p-6 max-w-3xl mx-auto mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="rounded-2xl border border-gray-100 drop-shadow-2xl">
          <CardContent className="p-8 space-y-4">
            {/* ===== Header ===== */}
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

            {/* ===== Product Details ===== */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                Product Details
              </h2>

              <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2 rounded-md" />
                    <Skeleton className="h-5 w-32 rounded-md" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ===== Category ===== */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-gray-400" />
                Category
              </h2>
              <div className="bg-gray-100 rounded-xl p-4 space-y-2">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </motion.div>

            {/* ===== Supplier ===== */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-gray-400" />
                Supplier
              </h2>
              <div className="bg-gray-100 rounded-xl p-4 space-y-2 text-sm">
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-3 w-36 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md" />
                <Skeleton className="h-3 w-40 rounded-md" />
                <Skeleton className="h-3 w-56 rounded-md" />
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4 text-center">
        <p className="text-red-600 font-medium">Error: {error}</p>
        <Button
          variant="ghost"
          onClick={() => router.push("/products")}
          className="mx-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  if (!product) {
    toast.error("No product found");
    return (
      <div className="p-6 text-center text-gray-500">No product found.</div>
    );
  }

  const {
    id: pid,
    name,
    barcode,
    category,
    supplier,
    price,
    costPrice,
    stockQuantity,
    expiryDate,
    status,
    isDeleted,
    unit,
  } = product;

  return (
    <motion.div
      className="p-6 max-w-3xl mx-auto mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="rounded-2xl border border-gray-100 drop-shadow-2xl">
        <CardContent className="p-8 space-y-4">
          {/* ===== Header ===== */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">{name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                ID: #{pid} • Barcode: {barcode ?? "—"}
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                onClick={() => router.push("/products")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </motion.div>
          </div>

          {/* ===== Product Details ===== */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-500" />
              Product Details
            </h2>

            <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
              <Detail
                label="Price"
                value={`AFG ${Number(price).toLocaleString()}`}
              />
              <Detail
                label="Cost Price"
                value={`AFG ${Number(costPrice).toLocaleString()}`}
              />
              <Detail label="Stock Quantity" value={stockQuantity} />
              <Detail label="Unit" value={unit || ""} />
              <Detail label="Expiry Date" value={formatDate(expiryDate)} />
              <Detail
                label="Status"
                value={
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {status}
                  </span>
                }
              />
              {isDeleted && (
                <Detail
                  label="Deleted"
                  value={<span className="text-red-600 font-medium">Yes</span>}
                />
              )}
            </div>
          </motion.div>

          {/* ===== Category ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-gray-500" />
              Category
            </h2>
            {category ? (
              <div className="bg-gray-100 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-800">
                  {category.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">ID: {category.id}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No category assigned
              </p>
            )}
          </motion.div>

          {/* ===== Supplier ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-gray-500" />
              Supplier
            </h2>

            {supplier ? (
              <div className="bg-gray-100 rounded-xl p-4 space-y-1 text-sm">
                <p className="font-medium text-gray-800 text-lg">{supplier.name}</p>
                <p className="text-gray-500">
                  Contact: <span className={"text-[1rem] text-gray-800 font-semibold"}>{supplier.contactPerson || "—"}</span>
                </p>
                <p className="text-gray-500">Phone: <span className={"text-[1rem] text-gray-800 font-semibold"}>{supplier.phone || "—"}</span></p>
                <p className="text-gray-500">Email: <span className={"text-[1rem] text-gray-800 font-semibold"}>{supplier.email || "—"}</span></p>
                <p className="text-gray-500">
                  Address:<span className={"text-[1rem] text-gray-800 font-semibold"}> {supplier.address || "—"}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No supplier assigned
              </p>
            )}
          </motion.div>
        </CardContent>
      </Card>
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
