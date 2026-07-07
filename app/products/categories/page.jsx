"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CategoriesPage() {
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
    } catch {
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
        const msg = data?.error?.message || data?.error || "Failed to create category";
        setError(msg);
        toast.error("Failed to create category.");
      }
    } catch (err) {
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
    if (showToast) toast("Edit canceled.", { icon: "🚫" });
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
        setCategories((prev) => prev.map((c) => (c.id === editingId ? data.data : c)));
        cancelEdit(false);
        toast.success("Category updated successfully.");
      } else {
        toast.error("Update failed: " + (data.error?.message || JSON.stringify(data.error)));
      }
    } catch {
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
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => { resolve(true); toast.dismiss(t.id); }}>Yes</Button>
            <Button size="sm" variant="outline"
              onClick={() => { resolve(false); toast.dismiss(t.id); }}>No</Button>
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
        toast.error("Delete failed: " + (data.error?.message || JSON.stringify(data.error)));
      }
    } catch {
      toast.error("Network error while deleting category.");
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Link href="/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>

      {/* Add form */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Add New Category</h2>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name..."
              className={error ? "border-red-400" : ""}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Add Category"}
          </Button>
        </form>
      </Card>

      {/* Category list */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-left w-8">#</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4 flex gap-2">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-16 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 text-center text-gray-500">No categories yet.</td>
                </tr>
              ) : (
                categories.map((cat, i) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-4">
                      {editingId === cat.id ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          className="max-w-xs"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {editingId === cat.id ? (
                        <Select value={editStatus} onValueChange={setEditStatus}>
                          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <StatusBadge status={cat.status} />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {editingId === cat.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white gap-1">
                              <Save className="w-3.5 h-3.5" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => cancelEdit()} className="gap-1">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(cat)} title="Edit">
                              <Pencil className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteCategory(cat.id)} title="Delete">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
