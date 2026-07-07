"use client";

import Link from "next/link";
import Image from "next/image";
import ProductImg from "@/assets/product_img.png";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, Eye, Save, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const LIMIT = 25;

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
  }, [currentPage, debouncedSearch, categoryFilter, statusFilter, stockFilter, sortBy]);

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
      toast.error("Stock quantity must be a whole number for items sold by piece (pcs).");
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
          prev.map((p) => (p.id === editingId ? { ...p, ...data.data } : p))
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
              onClick={() => { resolve(true); toast.dismiss(t.id); }}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { resolve(false); toast.dismiss(t.id); }}
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
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={ProductImg} width={100} height={100} alt="products page logo" />
          Product Management
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/products/add">
            <Button className="bg-orange-500 hover:bg-orange-600 text-md">Add Product</Button>
          </Link>
          <Link href="/products/categories">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-md">Categories</Button>
          </Link>
          <Link href="/suppliers">
            <Button className="bg-amber-500 hover:bg-amber-600 text-md">Suppliers</Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={String(categoryFilter)} onValueChange={(v) => setCategoryFilter(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Stock</SelectItem>
            <SelectItem value="in">In Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort (ID)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">Sort by ID</SelectItem>
            <SelectItem value="stock">Sort by Stock</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-[250px]">
          <Input
            placeholder="Search by name or barcode"
            className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent>
          {loading ? (
            <motion.div
              className="-m-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Card className="overflow-hidden rounded-2xl border-none">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="border-b text-gray-600 font-semibold text-lg">
                      <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Product</th>
                        <th className="px-6 py-3">Barcode</th>
                        <th className="px-4 py-2">Cost Price</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Price</th>
                        <th className="px-6 py-3">Stock</th>
                        <th className="px-6 py-3">Unit</th>
                        <th className="px-6 py-3">Expiry</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 animate-pulse">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3"><Skeleton className="h-6 w-8 rounded-md" /></td>
                          <td className="px-6 py-3"><Skeleton className="h-6 w-24 rounded-md" /></td>
                          <td className="px-6 py-3"><Skeleton className="h-6 w-20 rounded-md" /></td>
                          <td className="px-6 py-3"><Skeleton className="h-6 w-16 rounded-md" /></td>
                          <td className="px-6 py-3"><Skeleton className="h-6 w-20 rounded-md" /></td>
                          <td className="px-6 py-3"><Skeleton className="h-6 w-20 rounded-md" /></td>
                          <td className="px-6 py-3"><Skeleton className="h-6 w-10 rounded-md" /></td>
                          <td className="px-6 py-3"><Skeleton className="h-6 w-10 rounded-md" /></td>
                          <td className="px-6 py-3"><Skeleton className="h-6 w-24 rounded-md" /></td>
                          <td className="px-6 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                          <td className="px-6 py-3 flex items-center gap-2">
                            <Skeleton className="h-7 w-8 rounded-md" />
                            <Skeleton className="h-7 w-8 rounded-md" />
                            <Skeleton className="h-7 w-8 rounded-md" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-lg">
                  <TableHead>ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className={editValues ? "" : "pl-8"}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {products.length > 0 ? (
                    products.map((p) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b"
                      >
                        <TableCell>{p.id}</TableCell>
                        <TableCell>
                          {editingId === p.id ? (
                            <Input
                              value={editValues?.name || ""}
                              onChange={(e) => setEditValues((s) => ({ ...s, name: e.target.value }))}
                            />
                          ) : p.name}
                        </TableCell>
                        <TableCell>
                          {editingId === p.id ? (
                            <Input
                              value={editValues?.barcode || ""}
                              onChange={(e) => setEditValues((s) => ({ ...s, barcode: e.target.value }))}
                            />
                          ) : (p.barcode || <Minus />)}
                        </TableCell>
                        <TableCell>
                          {editingId === p.id ? (
                            <Input
                              type="number"
                              min="0"
                              value={editValues?.costPrice || 0}
                              onChange={(e) => setEditValues((s) => ({ ...s, costPrice: Number(e.target.value) }))}
                            />
                          ) : ("AFN " + (p.costPrice || 0))}
                        </TableCell>
                        <TableCell>
                          {editingId === p.id ? (
                            <Select
                              value={editValues.categoryId ? String(editValues.categoryId) : "no-category"}
                              onValueChange={(v) => setEditValues((s) => ({ ...s, categoryId: v === "no-category" ? null : Number(v) }))}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((c) => (
                                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (p.category?.name || <span className="text-gray-400">No category</span>)}
                        </TableCell>
                        <TableCell>
                          {editingId === p.id ? (
                            <Input
                              type="number"
                              min="0"
                              value={editValues?.price || ""}
                              onChange={(e) => setEditValues((s) => ({ ...s, price: Number(e.target.value) }))}
                            />
                          ) : ("AFN " + p.price)}
                        </TableCell>
                        <TableCell>
                          {editingId === p.id ? (
                            <Input
                              type="number"
                              step={editValues?.unit === "kg" ? "0.01" : "1"}
                              value={editValues?.stockQuantity || 0}
                              onChange={(e) => {
                                const val = e.target.value;
                                const unit = editValues?.unit || p.unit;
                                if (val === "") { setEditValues((s) => ({ ...s, stockQuantity: 0 })); return; }
                                const num = Number(val);
                                if (unit === "pcs") {
                                  if (Number.isInteger(num) && num >= 0) setEditValues((s) => ({ ...s, stockQuantity: num }));
                                } else {
                                  if (num >= 0) setEditValues((s) => ({ ...s, stockQuantity: num }));
                                }
                              }}
                              onKeyDown={(e) => {
                                const unit = editValues?.unit || p.unit;
                                if (unit === "pcs") { if (["-", ".", "e", "E"].includes(e.key)) e.preventDefault(); }
                                else { if (["-", "e", "E"].includes(e.key)) e.preventDefault(); }
                              }}
                            />
                          ) : (
                            p.unit === "kg" ? Number(p.stockQuantity).toFixed(2) : p.stockQuantity
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === p.id ? (
                            <Select
                              value={editValues?.unit || "pcs"}
                              onValueChange={(v) => setEditValues((s) => ({ ...s, unit: v }))}
                            >
                              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pcs">pcs</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (p.unit || "-")}
                        </TableCell>
                        <TableCell>
                          {editingId === p.id ? (
                            <Input
                              type="date"
                              value={editValues?.expiryDate || ""}
                              onChange={(e) => setEditValues((s) => ({ ...s, expiryDate: e.target.value || null }))}
                            />
                          ) : (p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("default", { year: "numeric", month: "short", day: "numeric" }) : <Minus />)}
                        </TableCell>
                        <TableCell className={editValues ? "" : "pr-8"}>
                          {editingId === p.id ? (
                            <Select
                              value={editValues?.status || "ACTIVE"}
                              onValueChange={(v) => setEditValues((s) => ({ ...s, status: v }))}
                            >
                              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === "ACTIVE" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                              {p.status}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className={editValues ? "flex gap-2" : "flex gap-2 pl-8"}>
                          {editingId === p.id ? (
                            <>
                              <Button size="sm" onClick={saveEdit} className="bg-green-400 hover:bg-green-300 hover:text-green-800">
                                <Save className="w-4 h-4" /> Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit} className="hover:bg-gray-300 hover:text-gray-700">
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => startEdit(p)} className="hover:bg-gray-300 hover:text-gray-700">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteProduct(p.id)} className="hover:bg-red-300 hover:text-red-800">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => router.push(`/products/${p.id}`)} className="hover:bg-gray-300 hover:text-gray-700">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-gray-500 py-10">
                        No products found.
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </motion.div>
  );
}
