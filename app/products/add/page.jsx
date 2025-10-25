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
  const [categoryId, setCategoryId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [unit, setUnit] = useState("pcs");

  // suppliers & suggestions
  const [suppliers, setSuppliers] = useState([]);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [supplierSuggestionsVisible, setSupplierSuggestionsVisible] =
    useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // categories & suggestions
  const [categories, setCategories] = useState([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categorySuggestionsVisible, setCategorySuggestionsVisible] =
    useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // UI state
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // boot: fetch suppliers and categories
  useEffect(() => {
    async function boot() {
      try {
        const sres = await fetch("/api/suppliers");
        const sjson = await sres.json();
        setSuppliers(
          Array.isArray(sjson?.data) ? sjson.data : sjson?.data ?? []
        );

        const cres = await fetch("/api/category");
        if (cres.ok) {
          const cjson = await cres.json();
          setCategories(
            Array.isArray(cjson?.data) ? cjson.data : cjson?.data ?? []
          );
        }
      } catch (err) {
        console.log("Error booting suppliers/categories:", err);
      }
    }
    boot();
  }, []);

  // For Unit changes
  useEffect(() => {
    // When unit changes from kg to pcs and stock has decimals, round it
    if (
      unit === "pcs" &&
      stockQuantity &&
      !Number.isInteger(Number(stockQuantity))
    ) {
      setStockQuantity(Math.round(Number(stockQuantity)).toString());
    }
  }, [unit]); // This will run whenever the unit changes

  // filter supplier suggestions
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

  // filter category suggestions
  const categorySuggestions = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return categories.slice(0, 6);
    return categories.filter(
      (c) => String(c.id).includes(q) || c.name?.toLowerCase().includes(q)
    );
  }, [categoryQuery, categories]);

  function chooseSupplier(s) {
    setSelectedSupplier(s);
    setSupplierQuery(s.name);
    setSupplierSuggestionsVisible(false);
  }
  function clearSelectedSupplier() {
    setSelectedSupplier(null);
    setSupplierQuery("");
  }

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

  function buildRequestBody() {
    return {
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      price: price !== "" ? Number(price) : undefined,
      costPrice: costPrice !== "" ? Number(costPrice) : undefined,
      categoryId:
        selectedCategory?.id ?? (categoryId ? Number(categoryId) : undefined),
      status,
      stockQuantity: stockQuantity !== "" ? Number(stockQuantity) : undefined,
      unit: unit || "pcs",
      expiryDate: expiryDate || undefined,
      supplierId: selectedSupplier?.id ?? undefined,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const validUnits = ["pcs", "kg"];
      if (!validUnits.includes(unit)) {
        setError("Invalid unit value. Must be 'pcs' or 'kg'.");
        setSubmitting(false);
        return;
      }

      // Validate stock quantity based on unit
      const stockNum = Number(stockQuantity);
      if (unit === "pcs" && !Number.isInteger(stockNum)) {
        setError(
          "Stock quantity must be a whole number for items sold by piece (pcs)."
        );
        setSubmitting(false);
        return;
      }
      
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
        // console.error("Error creating product:", data);
        const fieldErrs = data?.error?.fieldErrors || {};
        const formErrs = data?.error?.formErrors || [];
        setFieldErrors(fieldErrs);
        setError(
          formErrs.length
            ? formErrs.join(", ")
            : "Please correct the highlighted fields."
        );
      }
    } catch (err) {
      console.error("Network or unexpected error:", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Add Product</h1>
        <Link href="/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>

      <div className="flex justify-center">
        <form onSubmit={handleSubmit} className="min-w-4xl drop-shadow-2xl">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Product Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={fieldErrors.name?.[0] || ""}
                    className={fieldErrors.name ? "border-red-400" : ""}
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Barcode
                  </label>
                  <Input
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Price
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value;

                      // Allow empty value (so user can clear it)
                      if (val === "") {
                        setPrice("");
                        return;
                      }

                      // Prevent negatives and decimals
                      const num = Number(val);
                      if (num >= 0 && Number.isInteger(num)) {
                        setPrice(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (["-", ".", "e", "E"].includes(e.key))
                        e.preventDefault();
                    }}
                    placeholder={fieldErrors.price?.[0] || ""}
                    className={fieldErrors.price ? "border-red-400" : ""}
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Cost Price
                  </label>
                  <Input
                    type="number"
                    value={costPrice}
                    placeholder={fieldErrors.costPrice?.[0] || ""}
                    className={fieldErrors.costPrice ? "border-red-400" : ""}
                    onChange={(e) => {
                      const val = e.target.value;

                      // Allow empty value (so user can clear it)
                      if (val === "") {
                        setCostPrice("");
                        return;
                      }

                      // Prevent negatives and decimals
                      const num = Number(val);
                      if (num >= 0 && Number.isInteger(num)) {
                        setCostPrice(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (["-", ".", "e", "E"].includes(e.key))
                        e.preventDefault();
                    }}
                  />
                </div>

                {/* Unit (NEW FIELD) */}
                <div>
                  <label className="text-sm font-medium block mb-1">Unit</label>
                  <Select value={unit} onValueChange={(v) => setUnit(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    step={unit === "kg" ? "0.01" : "1"} // Allow decimals for kg
                    value={stockQuantity}
                    onChange={(e) => {
                      const val = e.target.value;

                      // Allow empty value (so user can clear it)
                      if (val === "") {
                        setStockQuantity("");
                        return;
                      }

                      const numValue = Number(val);

                      // Validate based on unit type
                      if (unit === "pcs") {
                        // For pcs, only allow integers
                        if (Number.isInteger(numValue) && numValue >= 0) {
                          setStockQuantity(val);
                        }
                      } else {
                        // For kg, allow decimals
                        if (numValue >= 0) {
                          setStockQuantity(val);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (unit === "pcs") {
                        // For pcs, block decimal point
                        if (["-", ".", "e", "E"].includes(e.key))
                          e.preventDefault();
                      } else {
                        // For kg, only block negative and scientific notation
                        if (["-", "e", "E"].includes(e.key)) e.preventDefault();
                      }
                    }}
                    placeholder={fieldErrors.stockQuantity?.[0] || ""}
                    className={
                      fieldErrors.stockQuantity ? "border-red-400" : ""
                    }
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Status
                  </label>
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

                {/* Expiry Date */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div className="relative md:col-span-2">
                  <label className="text-sm font-medium block mb-1">
                    Category
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={categoryQuery}
                      onChange={(e) => {
                        setCategoryQuery(e.target.value);
                        setCategorySuggestionsVisible(true);
                      }}
                      onFocus={() => setCategorySuggestionsVisible(true)}
                      onBlur={() =>
                        setTimeout(
                          () => setCategorySuggestionsVisible(false),
                          150
                        )
                      }
                      placeholder={
                        fieldErrors.categoryId?.[0] ||
                        "Type category name or id..."
                      }
                      className={`flex-1 ${
                        fieldErrors.categoryId ? "border-red-400" : ""
                      }`}
                    />
                    {selectedCategory && (
                      <Button variant="ghost" onClick={clearSelectedCategory}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {categorySuggestionsVisible &&
                    categorySuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 z-30 mt-1 bg-white border rounded max-h-40 overflow-auto">
                        {categorySuggestions.map((c) => (
                          <div
                            key={c.id}
                            onMouseDown={() => chooseCategory(c)}
                            className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium">{c.name}</div>
                              <div className="text-xs text-gray-500">
                                Status: {c.status}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {c.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {/* Supplier */}
                <div className="relative md:col-span-2">
                  <label className="text-sm font-medium block mb-1">
                    Supplier
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={supplierQuery}
                      onChange={(e) => {
                        setSupplierQuery(e.target.value);
                        setSupplierSuggestionsVisible(true);
                      }}
                      onFocus={() => setSupplierSuggestionsVisible(true)}
                      onBlur={() =>
                        setTimeout(
                          () => setSupplierSuggestionsVisible(false),
                          150
                        )
                      }
                      placeholder={
                        fieldErrors.supplierId?.[0] ||
                        "Type supplier name or id..."
                      }
                      className={`flex-1 ${
                        fieldErrors.supplierId ? "border-red-400" : ""
                      }`}
                    />
                    {selectedSupplier && (
                      <Button variant="ghost" onClick={clearSelectedSupplier}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {supplierSuggestionsVisible &&
                    supplierSuggestions.length > 0 && (
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
                            <div className="text-xs text-muted-foreground">
                              ID: {s.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              {/* form actions */}
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    className="bg-orange-500"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Create Product"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/products")}
                  >
                    Cancel
                  </Button>
                </div>

                {error && (
                  <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
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
