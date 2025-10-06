"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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
        if (!res.ok || !json.success) throw new Error(json?.error || "Failed to fetch");
        setProduct(json.data);
      } catch (err) {
        setError(err.message);
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

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-red-600">Error: {error}</div>
        <Button variant="ghost" onClick={() => router.push("/products")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  if (!product) {
    return <div className="p-6 text-gray-500">No product found.</div>;
  }

  const { id: pid, name, barcode, category, supplier, price, costPrice, stockQuantity, expiryDate, status, isDeleted } =
    product;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{name}</h1>
              <p className="text-sm text-gray-500">
                ID: #{pid} • Barcode: {barcode ?? "—"}
              </p>
            </div>
            <Button variant="ghost" onClick={() => router.push("/products")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Detail label="Price" value={`$${Number(price).toLocaleString()}`} />
            <Detail label="Cost Price" value={`$${Number(costPrice).toLocaleString()}`} />
            <Detail label="Stock Quantity" value={stockQuantity} />
            <Detail label="Expiry Date" value={formatDate(expiryDate)} />
            <Detail
              label="Status"
              value={
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {status}
                </span>
              }
            />
            {isDeleted && <Detail label="Deleted" value={<span className="text-red-600">Yes</span>} />}
          </div>

          {/* Category */}
          <div>
            <h3 className="text-base font-semibold mb-1">Category</h3>
            {category ? (
              <p className="text-sm">
                {category.name} <span className="text-gray-500 text-xs">(ID: {category.id})</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500">No category assigned</p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <h3 className="text-base font-semibold mb-1">Supplier</h3>
            {supplier ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{supplier.name}</p>
                <p className="text-gray-500">Contact: {supplier.contactPerson || "—"}</p>
                <p className="text-gray-500">Phone: {supplier.phone || "—"}</p>
                <p className="text-gray-500">Email: {supplier.email || "—"}</p>
                <p className="text-gray-500">Address: {supplier.address || "—"}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No supplier assigned</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* Small sub-component for clean detail rows */
function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
