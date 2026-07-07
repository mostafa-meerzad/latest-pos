"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, Save, X } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BackToDashboardButton from "@/components/BackToDashboardButton";
import SupplierImg from "@/assets/suppliers_img.png";
import PaginationBar from "@/components/PaginationBar";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

const LIMIT = 25;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: LIMIT.toString(),
        search: debouncedSearch,
      });
      const res = await fetch(`/api/suppliers?${params}`);
      const json = await res.json();
      if (json?.success) {
        setSuppliers(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
      } else {
        toast.error("Failed to fetch suppliers.");
      }
    } catch {
      toast.error("Error fetching suppliers.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  function startEdit(row) {
    setEditingId(row.id);
    setEditValues({ ...row });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
    toast("Edit canceled.", { icon: "🚫" });
  }

  async function saveEdit() {
    if (!editingId || !editValues) return;
    const payload = {
      name: editValues.name ?? undefined,
      contactPerson: editValues.contactPerson ?? undefined,
      phone: editValues.phone ?? undefined,
      email: editValues.email ?? undefined,
      address: editValues.address ?? undefined,
    };
    toast.loading("Saving changes...");
    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuppliers((prev) => prev.map((s) => (s.id === editingId ? data.data : s)));
        setEditingId(null);
        setEditValues(null);
        toast.dismiss();
        toast.success("Supplier updated successfully!");
      } else {
        let errMsg = "Update failed";
        if (data.error?.message) errMsg = data.error.message;
        else if (data.error?.fieldErrors) {
          const firstKey = Object.keys(data.error.fieldErrors)[0];
          errMsg = data.error.fieldErrors[firstKey][0];
        }
        toast.dismiss();
        toast.error(errMsg);
      }
    } catch {
      toast.error("Network error while saving supplier.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSupplier(id) {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm">Are you sure you want to deactivate this supplier?</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
                  const data = await res.json();
                  if (data.success) {
                    toast.success("Supplier deactivated successfully.");
                    fetchSuppliers();
                  } else {
                    toast.error("Failed to deactivate supplier.");
                  }
                } catch {
                  toast.error("Error occurred while deactivating supplier.");
                }
              }}>Yes</Button>
            <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>No</Button>
          </div>
        </div>
      ),
      { duration: 5000, position: "top-center" }
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={SupplierImg} width={60} height={60} alt="suppliers" />
          Supplier Management
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/products"><Button variant="outline">Products</Button></Link>
          <Link href="/suppliers/add-supplier"><Button>Add Supplier</Button></Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by supplier name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-left">Supplier</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Address</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-32 mb-1.5" />
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-28 mb-1.5" />
                      <Skeleton className="h-3 w-36" />
                    </td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-5 py-4 flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-500">
                    <p className="mb-3">No suppliers found.</p>
                    <Link href="/suppliers/add-supplier"><Button size="sm">Add Supplier</Button></Link>
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    {/* Supplier: name + contact person */}
                    <td className="px-5 py-4 max-w-[200px]">
                      {editingId === s.id ? (
                        <div className="space-y-1.5">
                          <Input placeholder="Name" value={editValues?.name || ""} onChange={(e) => setEditValues((p) => ({ ...p, name: e.target.value }))} />
                          <Input placeholder="Contact person" value={editValues?.contactPerson || ""} onChange={(e) => setEditValues((p) => ({ ...p, contactPerson: e.target.value }))} />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          {s.contactPerson && <p className="text-xs text-gray-400 mt-0.5">{s.contactPerson}</p>}
                        </>
                      )}
                    </td>

                    {/* Contact: phone + email */}
                    <td className="px-5 py-4">
                      {editingId === s.id ? (
                        <div className="space-y-1.5">
                          <Input placeholder="Phone" value={editValues?.phone || ""} onChange={(e) => setEditValues((p) => ({ ...p, phone: e.target.value }))} />
                          <Input type="email" placeholder="Email" value={editValues?.email || ""} onChange={(e) => setEditValues((p) => ({ ...p, email: e.target.value }))} />
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-700">{s.phone || <span className="text-gray-300">—</span>}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{s.email || <span className="text-gray-300">—</span>}</p>
                        </>
                      )}
                    </td>

                    {/* Address */}
                    <td className="px-5 py-4 max-w-[220px]">
                      {editingId === s.id ? (
                        <Input placeholder="Address" value={editValues?.address || ""} onChange={(e) => setEditValues((p) => ({ ...p, address: e.target.value }))} />
                      ) : (
                        <span className="text-gray-600">{s.address || <span className="text-gray-300">—</span>}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {editingId === s.id ? (
                          <>
                            <Button size="sm" disabled={saving} onClick={saveEdit} className="bg-green-500 hover:bg-green-600 text-white gap-1">
                              <Save className="w-3.5 h-3.5" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(s)} title="Edit">
                              <Pencil className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteSupplier(s.id)} title="Delete">
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

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
                <div className="flex gap-4 mt-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </Card>
          ))
        ) : suppliers.length === 0 ? (
          <Card>
            <div className="py-14 text-center">
              <p className="text-gray-500 mb-3">No suppliers found.</p>
              <Link href="/suppliers/add-supplier"><Button>Add Supplier</Button></Link>
            </div>
          </Card>
        ) : (
          suppliers.map((s) => (
            <Card key={s.id}>
              <div className="p-4">
                {editingId === s.id ? (
                  <div className="space-y-3">
                    <div><label className="text-xs text-muted-foreground mb-1 block">Name</label>
                      <Input value={editValues?.name || ""} onChange={(e) => setEditValues((p) => ({ ...p, name: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Contact Person</label>
                      <Input value={editValues?.contactPerson || ""} onChange={(e) => setEditValues((p) => ({ ...p, contactPerson: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                      <Input value={editValues?.phone || ""} onChange={(e) => setEditValues((p) => ({ ...p, phone: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Email</label>
                      <Input type="email" value={editValues?.email || ""} onChange={(e) => setEditValues((p) => ({ ...p, email: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Address</label>
                      <Input value={editValues?.address || ""} onChange={(e) => setEditValues((p) => ({ ...p, address: e.target.value }))} /></div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" disabled={saving} onClick={saveEdit} className="bg-green-500 hover:bg-green-600 text-white gap-1">
                        <Save className="w-3.5 h-3.5" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    {s.contactPerson && <p className="text-sm text-gray-400 mt-0.5">{s.contactPerson}</p>}
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{s.phone || "—"}</span>
                      <span>{s.email || "—"}</span>
                    </div>
                    {s.address && <p className="text-sm text-gray-400 mt-1">{s.address}</p>}
                    <div className="flex gap-1.5 mt-3">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(s)}>
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteSupplier(s.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
