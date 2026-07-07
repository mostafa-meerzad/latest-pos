"use client";

import Link from "next/link";
import Image from "next/image";
import ProductImg from "@/assets/product_img.png";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, Eye, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BackToDashboardButton from "@/components/BackToDashboardButton";
import PaginationBar from "@/components/PaginationBar";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const LIMIT = 25;
const LOW_STOCK_THRESHOLD = 10;

function StockDisplay({ quantity, unit }) {
  const num = Number(quantity);
  const label = unit === "kg" ? `${num.toFixed(2)} kg` : `${num} pcs`;
  if (num === 0)
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
        Out of stock
      </span>
    );
  if (num <= LOW_STOCK_THRESHOLD)
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        {label} · Low
      </span>
    );
  return <span className="text-sm text-gray-700">{label}</span>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);

  useEffect(() => {
    fetch("/api/category")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) setCategories(json.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter, statusFilter, stockFilter, sortBy]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: LIMIT.toString(),
        search: debouncedSearch,
        sortBy,
      });
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (stockFilter !== "all") params.set("stock", stockFilter);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data?.success) {
        setProducts(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error("Failed to load products.");
      }
    } catch {
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearch,
    categoryFilter,
    statusFilter,
    stockFilter,
    sortBy,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function startEdit(row) {
    setEditingId(row.id);
    setEditValues({
      ...row,
      categoryId: row.category?.id || row.categoryId || null,
      costPrice: row.costPrice || 0,
    });
  }

  function resetEditState() {
    setEditingId(null);
    setEditValues(null);
  }

  function cancelEdit() {
    resetEditState();
    toast("Edit canceled.", { icon: "🚫" });
  }

  async function saveEdit() {
    if (!editingId || !editValues) return;

    const priceNum = Number(editValues.price);
    const stockNum = Number(editValues.stockQuantity);
    const costNum = Number(editValues.costPrice ?? 0);
    const unit = editValues.unit || "pcs";

    if (isNaN(priceNum) || editValues.price === "" || priceNum < 0) {
      toast.error("Price cannot be empty or negative or an invalid value.");
      return;
    }
    if (isNaN(stockNum) || editValues.stockQuantity === "" || stockNum < 0) {
      toast.error("Stock cannot be empty or negative.");
      return;
    }
    if (isNaN(costNum) || editValues.costPrice === "" || costNum < 0) {
      toast.error("Cost price cannot be empty or negative.");
      return;
    }
    if (unit === "pcs" && !Number.isInteger(stockNum)) {
      toast.error(
        "Stock quantity must be a whole number for items sold by piece (pcs).",
      );
      return;
    }
    if (priceNum < costNum) {
      toast.error("Price cannot be less than the product's cost price.");
      return;
    }

    toast.loading("Saving changes...");
    try {
      const res = await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editValues.name,
          barcode: editValues.barcode,
          costPrice: costNum,
          price: priceNum,
          stockQuantity: stockNum,
          unit: editValues.unit,
          expiryDate: editValues.expiryDate,
          status: editValues.status,
          categoryId: editValues.categoryId || editValues.category?.id || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.dismiss();
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...data.data } : p)),
        );
        resetEditState();
        toast.success("Product updated successfully.");
      } else {
        toast.dismiss();
        toast.error("Failed to update product.");
      }
    } catch {
      toast.error("Network error while saving changes.");
    }
  }

  async function deleteProduct(id) {
    const confirmed = await new Promise((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <span>Are you sure you want to delete this product?</span>
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                resolve(true);
                toast.dismiss(t.id);
              }}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                resolve(false);
                toast.dismiss(t.id);
              }}
            >
              No
            </Button>
          </div>
        </div>
      ));
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        if (editingId === id) cancelEdit();
        toast.success("Product deleted successfully.");
        fetchProducts();
      } else {
        toast.error("Failed to delete product.");
      }
    } catch {
      toast.error("Network error while deleting product.");
    }
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image
            src={ProductImg}
            width={60}
            height={60}
            alt="products page logo"
          />
          Product Management
        </h1>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link href="/products/add">
            <Button>Add Product</Button>
          </Link>
          <Link href="/products/categories">
            <Button variant="outline">Categories</Button>
          </Link>
          <Link href="/suppliers">
            <Button variant="outline">Suppliers</Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={String(categoryFilter)}
          onValueChange={(v) => setCategoryFilter(v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in">In Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">Sort by ID</SelectItem>
            <SelectItem value="stock">Sort by Stock</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or barcode"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Price</th>
                <th className="px-5 py-3 text-left">Stock</th>
                <th className="px-5 py-3 text-left">Expiry</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-36 mb-1.5" />
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-20 mb-1.5" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-5 py-4 flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    <p className="mb-3">No products found.</p>
                    <Link href="/products/add">
                      <Button size="sm">Add Product</Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {products.map((p) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Product: name + barcode */}
                      <td className="px-5 py-4 max-w-[220px]">
                        {editingId === p.id ? (
                          <div className="space-y-1.5">
                            <Input
                              placeholder="Name"
                              value={editValues?.name || ""}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...s,
                                  name: e.target.value,
                                }))
                              }
                            />
                            <Input
                              placeholder="Barcode"
                              value={editValues?.barcode || ""}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...s,
                                  barcode: e.target.value,
                                }))
                              }
                            />
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-gray-900 leading-tight">
                              {p.name}
                            </p>
                            {p.barcode ? (
                              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                                {p.barcode}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-300 mt-0.5">
                                No barcode
                              </p>
                            )}
                          </>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        {editingId === p.id ? (
                          <Select
                            value={
                              editValues.categoryId
                                ? String(editValues.categoryId)
                                : "no-category"
                            }
                            onValueChange={(v) =>
                              setEditValues((s) => ({
                                ...s,
                                categoryId:
                                  v === "no-category" ? null : Number(v),
                              }))
                            }
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-category">
                                No category
                              </SelectItem>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-gray-700">
                            {p.category?.name || (
                              <span className="text-gray-400">—</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Price: sell + cost */}
                      <td className="px-5 py-4">
                        {editingId === p.id ? (
                          <div className="space-y-1.5">
                            <div>
                              <label className="text-xs text-gray-400 mb-0.5 block">
                                Sell
                              </label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Sell price"
                                value={editValues?.price || ""}
                                onChange={(e) =>
                                  setEditValues((s) => ({
                                    ...s,
                                    price: Number(e.target.value),
                                  }))
                                }
                                className="w-28"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-0.5 block">
                                Cost
                              </label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Cost price"
                                value={editValues?.costPrice || 0}
                                onChange={(e) =>
                                  setEditValues((s) => ({
                                    ...s,
                                    costPrice: Number(e.target.value),
                                  }))
                                }
                                className="w-28"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900">
                              AFN {p.price}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Cost: AFN {p.costPrice || 0}
                            </p>
                          </>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4">
                        {editingId === p.id ? (
                          <div className="flex items-end gap-1.5">
                            <div>
                              <label className="text-xs text-gray-400 mb-0.5 block">
                                Qty
                              </label>
                              <Input
                                type="number"
                                step={editValues?.unit === "kg" ? "0.01" : "1"}
                                value={editValues?.stockQuantity || 0}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const unit = editValues?.unit || p.unit;
                                  if (val === "") {
                                    setEditValues((s) => ({
                                      ...s,
                                      stockQuantity: 0,
                                    }));
                                    return;
                                  }
                                  const num = Number(val);
                                  if (unit === "pcs") {
                                    if (Number.isInteger(num) && num >= 0)
                                      setEditValues((s) => ({
                                        ...s,
                                        stockQuantity: num,
                                      }));
                                  } else {
                                    if (num >= 0)
                                      setEditValues((s) => ({
                                        ...s,
                                        stockQuantity: num,
                                      }));
                                  }
                                }}
                                onKeyDown={(e) => {
                                  const unit = editValues?.unit || p.unit;
                                  if (unit === "pcs") {
                                    if (["-", ".", "e", "E"].includes(e.key))
                                      e.preventDefault();
                                  } else {
                                    if (["-", "e", "E"].includes(e.key))
                                      e.preventDefault();
                                  }
                                }}
                                className="w-20"
                              />
                            </div>
                            <Select
                              value={editValues?.unit || "pcs"}
                              onValueChange={(v) =>
                                setEditValues((s) => ({ ...s, unit: v }))
                              }
                            >
                              <SelectTrigger className="w-[72px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pcs">pcs</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <StockDisplay
                            quantity={p.stockQuantity}
                            unit={p.unit}
                          />
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-4">
                        {editingId === p.id ? (
                          <Input
                            type="date"
                            value={editValues?.expiryDate || ""}
                            onChange={(e) =>
                              setEditValues((s) => ({
                                ...s,
                                expiryDate: e.target.value || null,
                              }))
                            }
                            className="w-36"
                          />
                        ) : (
                          <span className="text-gray-600">
                            {p.expiryDate ? (
                              new Date(p.expiryDate).toLocaleDateString(
                                "default",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {editingId === p.id ? (
                          <Select
                            value={editValues?.status || "ACTIVE"}
                            onValueChange={(v) =>
                              setEditValues((s) => ({ ...s, status: v }))
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <StatusBadge status={p.status} />
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {editingId === p.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={saveEdit}
                                className="bg-green-500 hover:bg-green-600 text-white gap-1"
                              >
                                <Save className="w-3.5 h-3.5" /> Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                                className="gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(p)}
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4 text-gray-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteProduct(p.id)}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.push(`/products/${p.id}`)}
                                title="View"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-4 mt-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-28 rounded-full mt-1" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <p className="text-gray-500 mb-3">No products found.</p>
              <Link href="/products/add">
                <Button>Add Product</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          products.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                {editingId === p.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Name
                      </label>
                      <Input
                        value={editValues?.name || ""}
                        onChange={(e) =>
                          setEditValues((s) => ({ ...s, name: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Barcode
                      </label>
                      <Input
                        value={editValues?.barcode || ""}
                        onChange={(e) =>
                          setEditValues((s) => ({
                            ...s,
                            barcode: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Cost Price
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={editValues?.costPrice || 0}
                        onChange={(e) =>
                          setEditValues((s) => ({
                            ...s,
                            costPrice: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Category
                      </label>
                      <Select
                        value={
                          editValues.categoryId
                            ? String(editValues.categoryId)
                            : "no-category"
                        }
                        onValueChange={(v) =>
                          setEditValues((s) => ({
                            ...s,
                            categoryId: v === "no-category" ? null : Number(v),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-category">
                            No category
                          </SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Sell Price
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={editValues?.price || ""}
                        onChange={(e) =>
                          setEditValues((s) => ({
                            ...s,
                            price: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Stock
                      </label>
                      <Input
                        type="number"
                        step={editValues?.unit === "kg" ? "0.01" : "1"}
                        value={editValues?.stockQuantity || 0}
                        onChange={(e) => {
                          const val = e.target.value;
                          const unit = editValues?.unit || p.unit;
                          if (val === "") {
                            setEditValues((s) => ({ ...s, stockQuantity: 0 }));
                            return;
                          }
                          const num = Number(val);
                          if (unit === "pcs") {
                            if (Number.isInteger(num) && num >= 0)
                              setEditValues((s) => ({
                                ...s,
                                stockQuantity: num,
                              }));
                          } else {
                            if (num >= 0)
                              setEditValues((s) => ({
                                ...s,
                                stockQuantity: num,
                              }));
                          }
                        }}
                        onKeyDown={(e) => {
                          const unit = editValues?.unit || p.unit;
                          if (unit === "pcs") {
                            if (["-", ".", "e", "E"].includes(e.key))
                              e.preventDefault();
                          } else {
                            if (["-", "e", "E"].includes(e.key))
                              e.preventDefault();
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Unit
                      </label>
                      <Select
                        value={editValues?.unit || "pcs"}
                        onValueChange={(v) =>
                          setEditValues((s) => ({ ...s, unit: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">pcs</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Expiry Date
                      </label>
                      <Input
                        type="date"
                        value={editValues?.expiryDate || ""}
                        onChange={(e) =>
                          setEditValues((s) => ({
                            ...s,
                            expiryDate: e.target.value || null,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Status
                      </label>
                      <Select
                        value={editValues?.status || "ACTIVE"}
                        onValueChange={(v) =>
                          setEditValues((s) => ({ ...s, status: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        className="bg-green-500 hover:bg-green-600 text-white gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        className="gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        {p.barcode && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {p.barcode}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="font-semibold">AFN {p.price}</span>
                      <span className="text-gray-400">
                        Cost: AFN {p.costPrice || 0}
                      </span>
                    </div>
                    <div className="mt-2">
                      <StockDisplay quantity={p.stockQuantity} unit={p.unit} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{p.category?.name || "No category"}</span>
                      {p.expiryDate && (
                        <span>
                          Exp:{" "}
                          {new Date(p.expiryDate).toLocaleDateString(
                            "default",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(p)}
                      >
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteProduct(p.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/products/${p.id}`)}
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <PaginationBar
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </motion.div>
  );
}
