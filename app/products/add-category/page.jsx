"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateCategoryPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
        router.push("/products"); // Redirect back to products list
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Add Category</h1>
        <Link href="/products">
          <Button variant="outline">Back to products</Button>
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg">
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 mt-4">
              {/* Category Name */}
              <div>
                <label className="text-sm font-medium block mb-1">Category Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex items-center gap-3">
              <Button type="submit" className="bg-orange-500" disabled={submitting}>
                {submitting ? "Saving..." : "Create Category"}
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
  );
}
