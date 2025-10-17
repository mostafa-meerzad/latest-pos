"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CategoriesPage() {
  const router = useRouter();

  // States
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories
  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/category");
      const data = await res.json();
      if (data.success) {
        // Only show non-deleted categories
        setCategories(data.data.filter((cat) => !cat.is_deleted));
      } else {
        console.error("Failed to load categories", data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  // Add new category
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Category name is required.");

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
        fetchCategories(); // Refresh table
      } else {
        const msg =
          data?.error?.message ||
          data?.error ||
          JSON.stringify(data?.error || data) ||
          "Failed to create category";
        setError(msg);
      }
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  // Edit category
  function startEdit(cat) {
    setEditingId(cat.id);
    setEditValue(cat.name);
    setEditStatus(cat.status);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
    setEditStatus("ACTIVE");
  }

  async function saveEdit() {
    if (!editingId || !editValue.trim()) return;
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
        cancelEdit();
      } else {
        alert(
          "Update failed: " +
            (data.error?.message || JSON.stringify(data.error))
        );
      }
    } catch (err) {
      alert("Network error while saving category");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // Soft delete
  async function deleteCategory(id) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/category/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(
          "Delete failed: " +
            (data.error?.message || JSON.stringify(data.error))
        );
      }
    } catch (err) {
      alert("Network error deleting category");
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        <span>Loading categories...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mt-3 mr-6">
        <Link href="/products">
          <Button variant="outline" >
            Back to Products
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 m-6">
        {/* LEFT SIDE - Add Category */}
        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Add Category</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Category Name
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        error === "Category name is required."
                          ? error
                          : "Enter category name..."
                      }
                      className={
                        error === "Category name is required."
                          ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                          : ""
                      }
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600">
                      {error !== "Category name is required." && String(error)}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      className="bg-orange-500"
                      disabled={submitting}
                    >
                      {submitting ? "Saving..." : "Create Category"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE - Manage Categories */}
        <div>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Manage Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-gray-500"
                      >
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat, i) => (
                      <TableRow key={cat.id}>
                        <TableCell className="text-center">{i + 1}</TableCell>
                        <TableCell>
                          {editingId === cat.id ? (
                            <input
                              className="border p-1 rounded w-full"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                            />
                          ) : (
                            cat.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === cat.id ? (
                            <select
                              className="border p-1 rounded"
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded text-xs ${
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
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 mr-1" /> Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
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
                              >
                                <Pencil className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteCategory(cat.id)}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
