"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

export default function CreateProductPage() {
  const router = useRouter();

  // form state
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [categoryId, setCategoryId] = useState(""); // numeric id (set by selection or manual)
  const [stockQuantity, setStockQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  // suppliers & suggestions
  const [suppliers, setSuppliers] = useState([]);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [supplierSuggestionsVisible, setSupplierSuggestionsVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null); // { id, name, ... }

  // categories & suggestions (NEW)
  const [categories, setCategories] = useState([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categorySuggestionsVisible, setCategorySuggestionsVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // { id, name }

  // UI state
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // boot: fetch suppliers and categories
  useEffect(() => {
    async function boot() {
      try {
        // suppliers
        const sres = await fetch("/api/suppliers");
        const sjson = await sres.json();
        const supplierList = Array.isArray(sjson?.data) ? sjson.data : sjson?.data ?? [];
        setSuppliers(supplierList);

        // categories (endpoint as you specified)
        try {
          const cres = await fetch("/api/category");
          if (cres.ok) {
            const cjson = await cres.json();
            const cats = Array.isArray(cjson?.data) ? cjson.data : cjson?.data ?? [];
            if (Array.isArray(cats)) setCategories(cats);
          }
        } catch (e) {
          // ignore - categories may not exist
          console.warn("Could not load /api/category", e);
        }
      } catch (err) {
        console.error("Error booting suppliers/categories:", err);
      }
    }
    boot();
  }, []);

  // supplier suggestions filter
  const supplierSuggestions = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase();
    if (!q) return suppliers.slice(0, 6);
    return suppliers.filter(
      (s) =>
        String(s.id).includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.contactPerson?.toLowerCase().includes(q)
    );
  }, [supplierQuery, suppliers]);

  // category suggestions filter (NEW)
  const categorySuggestions = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return categories.slice(0, 6);
    return categories.filter(
      (c) => String(c.id).includes(q) || c.name?.toLowerCase().includes(q)
    );
  }, [categoryQuery, categories]);

  // choose supplier
  function chooseSupplier(s) {
    setSelectedSupplier(s);
    setSupplierQuery(s.name);
    setSupplierSuggestionsVisible(false);
  }
  function clearSelectedSupplier() {
    setSelectedSupplier(null);
    setSupplierQuery("");
  }

  // choose category (NEW)
  function chooseCategory(c) {
    setSelectedCategory(c);
    setCategoryQuery(c.name);
    setCategoryId(c.id);
    setCategorySuggestionsVisible(false);
  }
  function clearSelectedCategory() {
    setSelectedCategory(null);
    setCategoryQuery("");
    setCategoryId("");
  }

  // build request body
  function buildRequestBody() {
    return {
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      price: price !== "" ? Number(price) : undefined,
      costPrice: costPrice !== "" ? Number(costPrice) : undefined,
      categoryId: selectedCategory?.id ?? (categoryId ? Number(categoryId) : undefined),
      status,
      stockQuantity: stockQuantity !== "" ? Number(stockQuantity) : undefined,
      expiryDate: expiryDate || undefined,
      supplierId: selectedSupplier?.id ?? undefined,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // minimal client-side validation
    if (!name.trim()) return setError("Product name is required.");
    const finalCategoryId = selectedCategory?.id ?? (categoryId ? Number(categoryId) : undefined);
    if (!finalCategoryId) return setError("Category is required (select from suggestions or type ID).");
    if (!price) return setError("Price is required.");

    setSubmitting(true);
    try {
      const body = buildRequestBody();
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/products");
      } else {
        const msg =
          data?.error?.message ||
          data?.error ||
          JSON.stringify(data?.error || data) ||
          "Failed to create product";
        setError(msg);
      }
    } catch (err) {
      console.error("Error creating product:", err);
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Add Product</h1>
        <Link href="/products">
          <Button variant="outline" className={"drop-shadow-2xl"}>Back to Products</Button>
        </Link>
      </div>
    <div className="flex justify-center">
      <form onSubmit={handleSubmit} className="min-w-4xl drop-shadow-2xl">
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium block mb-1">Product Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* Barcode */}
              <div>
                <label className="text-sm font-medium block mb-1">Barcode</label>
                <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              </div>

              {/* Price */}
              <div>
                <label className="text-sm font-medium block mb-1">Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className="text-sm font-medium block mb-1">Cost Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="text-sm font-medium block mb-1">Stock Quantity</label>
                <Input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="text-sm font-medium block mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium block mb-1">Status</label>
                <Select onValueChange={(v) => setStatus(v)} value={status}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category (suggestion logic) */}
              <div className="relative md:col-span-2">
                <label className="text-sm font-medium block mb-1">Category </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={categoryQuery}
                    onChange={(e) => {
                      setCategoryQuery(e.target.value);
                      setCategorySuggestionsVisible(true);
                    }}
                    onFocus={() => setCategorySuggestionsVisible(true)}
                    onBlur={() => setTimeout(() => setCategorySuggestionsVisible(false), 150)}
                    placeholder="Type category name or id..."
                    className="flex-1"
                  />
                  {selectedCategory && (
                    <Button variant="ghost" onClick={clearSelectedCategory}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {categorySuggestionsVisible && categorySuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-30 mt-1 bg-white border rounded max-h-40 overflow-auto">
                    {categorySuggestions.map((c) => (
                      <div
                        key={c.id}
                        onMouseDown={() => chooseCategory(c)}
                        className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-gray-500">Status: {c.status}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">ID: {c.id}</div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCategory && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected Category: <strong>{selectedCategory.name}</strong> (ID:{" "}
                    {selectedCategory.id})
                  </div>
                )}

                
              </div>

              {/* Supplier (search + suggestions) */}
              <div className="relative md:col-span-2">
                <label className="text-sm font-medium block mb-1">Supplier </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={supplierQuery}
                    onChange={(e) => {
                      setSupplierQuery(e.target.value);
                      setSupplierSuggestionsVisible(true);
                    }}
                    onFocus={() => setSupplierSuggestionsVisible(true)}
                    onBlur={() => setTimeout(() => setSupplierSuggestionsVisible(false), 150)}
                    placeholder="Type supplier name or id..."
                    className="flex-1"
                  />
                  {selectedSupplier && (
                    <Button variant="ghost" onClick={clearSelectedSupplier}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {supplierSuggestionsVisible && supplierSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-30 mt-1 bg-white border rounded max-h-40 overflow-auto">
                    {supplierSuggestions.map((s) => (
                      <div
                        key={s.id}
                        onMouseDown={() => chooseSupplier(s)}
                        className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-gray-500">
                            {s.phone} • {s.email}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">ID: {s.id}</div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedSupplier && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected Supplier: <strong>{selectedSupplier.name}</strong> (ID:{" "}
                    {selectedSupplier.id})
                  </div>
                )}
              </div>
            </div>

            {/* form actions */}
            <div className="mt-6 flex items-center gap-3">
              <Button type="submit" className="bg-orange-500" disabled={submitting}>
                {submitting ? "Saving..." : "Create Product"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/products")}>
                Cancel
              </Button>

              {error && (
                <div className="ml-4 text-sm text-red-600">
                  {String(error)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
    </div>
  );
}
