"use client";

import Link from "next/link";
import Image from "next/image";
import ProductImg from "@/assets/product_img.png";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, Eye, Save } from "lucide-react";
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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // NEW
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  // inline editing states
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);

  const itemsPerPage = 6;

  useEffect(() => {
    async function fetchProductsAndCategories() {
      try {
        // products
        const pres = await fetch("/api/products");
        const pdata = await pres.json();
        if (pdata?.success) {
          setProducts(pdata.data || []);
        }

        // categories (endpoint: /api/category)
        try {
          const cres = await fetch("/api/category");
          if (cres.ok) {
            const cjson = await cres.json();
            if (cjson?.success && Array.isArray(cjson.data)) {
              setCategories(cjson.data || []);
            } else if (Array.isArray(cjson?.data)) {
              // fallback if response shape differs
              setCategories(cjson.data);
            }
          }
        } catch (catErr) {
          console.warn("Could not fetch categories:", catErr);
        }
      } catch (err) {
        console.error("Error fetching products/categories:", err);
      }
    }
    fetchProductsAndCategories();
  }, []);

  // ----------------------------
  // 🔹 Inline Editing Functions
  // ----------------------------
  function startEdit(row) {
    setEditingId(row.id);
    setEditValues({ ...row });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
  }

  async function saveEdit() {
    if (!editingId || !editValues) return;
    const priceNum = Number(editValues.price);
    const stockNum = Number(editValues.stockQuantity);
    const costNum = Number(editValues.costPrice ?? 0); // fallback if costPrice exists in your model

    // --- Validation checks ---
    if (isNaN(priceNum) || editValues.price === "" || priceNum < 0) {
      alert(" Price cannot be empty or negative.");
      return;
    }

    if (isNaN(stockNum) || editValues.stockQuantity === "" || stockNum < 0) {
      alert(" Stock cannot be empty or negative.");
      return;
    }

    if (priceNum < costNum) {
      alert(" Price cannot be less than the product’s cost price.");
      return;
    }
    try {
      const res = await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...editValues } : p))
        );
        cancelEdit();
      } else {
        alert("Failed to update product");
      }
    } catch (err) {
      console.error("Error saving product:", err);
    }
  }

  // ----------------------------
  // 🔹 Delete Function
  // ----------------------------
  async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        // remove product locally so UI updates instantly
        setProducts((prev) => prev.filter((p) => p.id !== id));
        // if we were editing this row, cancel edit
        if (editingId === id) cancelEdit();
      } else {
        alert("Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  }

  // ----------------------------
  // 🔹 Filtering & Sorting
  // ----------------------------
  const filteredData = useMemo(() => {
    let result = [...products];

    if (categoryFilter !== "all") {
      const catId = Number(categoryFilter);
      result = result.filter((p) => p.category && p.category.id === catId);
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (stockFilter !== "all") {
      if (stockFilter === "in")
        result = result.filter((p) => p.stockQuantity > 0);
      if (stockFilter === "out")
        result = result.filter((p) => p.stockQuantity === 0);
    }

    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === "id") result.sort((a, b) => a.id - b.id);
    if (sortBy === "stock")
      result.sort((a, b) => b.stockQuantity - a.stockQuantity);

    return result;
  }, [
    products,
    categoryFilter,
    statusFilter,
    stockFilter,
    sortBy,
    searchQuery,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ----------------- Header ----------------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image
            src={ProductImg}
            width={100}
            height={100}
            alt="products page logo"
          />
          Product Management
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/products/add">
            <Button className="bg-orange-500 hover:bg-orange-600 text-md drop-shadow-xl">
              Add Product
            </Button>
          </Link>
          <Link href="/products/categories">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-md drop-shadow-xl">
              Categories
            </Button>
          </Link>
          <Link href="/suppliers">
            <Button className="bg-amber-500 hover:bg-amber-600 text-md drop-shadow-xl">
              Suppliers
            </Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* ----------------- Filters ----------------- */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter - dynamically loaded */}
        <Select
          value={String(categoryFilter)}
          onValueChange={(v) => setCategoryFilter(v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
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

        {/* Stock Filter */}
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

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort (ID)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">Sort by ID</SelectItem>
            <SelectItem value="stock">Sort by Stock</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
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

      {/* ----------------- Table ----------------- */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="text-lg">
                <TableHead>ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>
                      {editingId === p.id ? (
                        <Input
                          value={editValues?.name || ""}
                          onChange={(e) =>
                            setEditValues((s) => ({
                              ...s,
                              name: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        p.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === p.id ? (
                        <Input
                          type="number"
                          value={editValues?.price || ""}
                          onChange={(e) =>
                            setEditValues((s) => ({
                              ...s,
                              price: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        "AFN " + p.price
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === p.id ? (
                        <Input
                          type="number"
                          value={editValues?.stockQuantity || ""}
                          onChange={(e) =>
                            setEditValues((s) => ({
                              ...s,
                              stockQuantity: Number(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        p.stockQuantity
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === p.id ? (
                        <Input
                          type="date"
                          value={editValues?.expiryDate || ""}
                          onChange={(e) =>
                            setEditValues((s) => ({
                              ...s,
                              expiryDate: e.target.value
                                ? e.target.value
                                : null,
                            }))
                          }
                        />
                      ) : p.expiryDate ? (
                        new Date(p.expiryDate).toLocaleDateString("default", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      ) : (
                        ""
                      )}
                    </TableCell>
                    <TableCell>
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
                        <span
                          className={`px-2 py-1 rounded text-sm font-semibold ${
                            p.status === "ACTIVE"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {editingId === p.id ? (
                        <>
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-4 h-4" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => startEdit(p)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteProduct(p.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/products/${p.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ----------------- Pagination ----------------- */}
      {totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lt;
          </Button>

          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                className={
                  page === currentPage ? "bg-orange-500 text-white" : ""
                }
                size="sm"
                onClick={() => goToPage(page)}
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &gt;
          </Button>
        </div>
      )}
    </div>
  );
}
