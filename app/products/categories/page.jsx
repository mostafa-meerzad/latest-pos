"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/category");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data.filter((cat) => !cat.is_deleted));
      } else {
        toast.error("Failed to load categories.");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Network error while loading categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Category name is required.");
      toast.error("Category name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setName("");
        fetchCategories();
        toast.success("Category created successfully.");
      } else {
        const msg =
          data?.error?.message ||
          data?.error ||
          JSON.stringify(data?.error || data) ||
          "Failed to create category";
        setError(msg);
        toast.error("Failed to create category.");
      }
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err.message || "Network error");
      toast.error("Network error while creating category.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditValue(cat.name);
    setEditStatus(cat.status);
  }

  function cancelEdit(showToast = true) {
    setEditingId(null);
    setEditValue("");
    setEditStatus("ACTIVE");
    if (showToast) {
      toast("Edit canceled.", { icon: "🚫" });
    }
  }

  async function saveEdit() {
    if (!editingId || !editValue.trim()) {
      toast.error("Category name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/category/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValue, status: editStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? data.data : c))
        );
        cancelEdit(false); // 👈 skip cancel toast
        toast.success("Category updated successfully.");
      } else {
        toast.error(
          "Update failed: " +
            (data.error?.message || JSON.stringify(data.error))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while saving category.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id) {
    const confirmed = await new Promise((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <span>Are you sure you want to delete this category?</span>
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
      const res = await fetch(`/api/category/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Category deleted successfully.");
      } else {
        toast.error(
          "Delete failed: " +
            (data.error?.message || JSON.stringify(data.error))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while deleting category.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex flex-col gap-6 justify-center">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex justify-end mb-6">
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>

          <div className="grid grid-cols-1 justify-center gap-4 ">
            {/* Left side - Add Category skeleton */}
            <div>
              <div className="border rounded-xl p-6 shadow-sm">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
            </div>

            {/* Right side - Manage Categories skeleton */}
            <div>
              <div className="border rounded-xl p-6 shadow-sm">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 items-center gap-4 border-b pb-3"
                    >
                      <div className="flex justify-center">
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-16" />
                      <div className="flex justify-center space-x-2">
                        <Skeleton className="h-8 w-16 rounded-md" />
                        <Skeleton className="h-8 w-16 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Manage Categories
          </h1>
          <Link href="/products">
            <Button variant="outline" className="rounded-md hover:bg-gray-100">
              Back to Products
            </Button>
          </Link>
        </div>

        {/* Unified Card */}
        <Card className="shadow-md border border-gray-100 rounded-2xl bg-white">
          <CardContent className="p-6">
            {/* Add Category Section */}
            <div className="pb-6 border-b border-gray-100 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Add New Category
              </h2>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-1">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter category name..."
                    className={`rounded-xl ${
                      error ? "border-red-400 focus:ring-red-400" : ""
                    }`}
                  />
                  {error && (
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 rounded-xl text-white px-6"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Add Category"}
                </Button>
              </form>
            </div>

            {/* Manage Categories Table */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Existing Categories
              </h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center w-40">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-gray-500 py-6"
                        >
                          No categories found
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((cat, i) => (
                        <TableRow
                          key={cat.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <TableCell className="text-center font-medium text-gray-700">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            {editingId === cat.id ? (
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="rounded-lg"
                                autoFocus
                              />
                            ) : (
                              <span className="font-medium text-gray-800">
                                {cat.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === cat.id ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="border rounded-lg p-1 text-sm"
                              >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  cat.status === "ACTIVE"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {cat.status}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center space-x-2">
                            {editingId === cat.id ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={saveEdit}
                                  disabled={saving}
                                  className={
                                    "bg-green-400 hover:bg-green-300 hover:text-green-800"
                                  }
                                >
                                  <Save className="w-4 h-4 mr-1" /> Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                  className="rounded-lg"
                                >
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(cat)}
                                  className={
                                    "hover:bg-gray-300 hover:text-gray-700"
                                  }
                                >
                                  <Pencil className="w-4 h-4 mr-1" /> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteCategory(cat.id)}
                                  className={
                                    "hover:bg-red-300 hover:text-red-800"
                                  }
                                >
                                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
