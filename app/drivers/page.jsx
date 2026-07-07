"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, Save, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BackToDashboardButton from "@/components/BackToDashboardButton";
import PaginationBar from "@/components/PaginationBar";
import { Skeleton } from "@/components/ui/skeleton";

const LIMIT = 25;

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: LIMIT.toString(),
        search: debouncedSearch,
      });
      const res = await fetch(`/api/drivers?${params}`);
      const data = await res.json();
      if (data?.success) {
        setDrivers(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error("Failed to fetch drivers.");
      }
    } catch {
      toast.error("Error fetching drivers.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

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
    const toastId = toast.loading("Saving changes...");
    try {
      const res = await fetch(`/api/drivers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValues.name, phone: editValues.phone }),
      });
      const data = await res.json();
      if (data.success) {
        setDrivers((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...editValues } : d)));
        setEditingId(null);
        setEditValues(null);
        toast.success("Driver updated successfully!", { id: toastId });
      } else {
        toast.error("Failed to update driver.", { id: toastId });
      }
    } catch {
      toast.error("Error saving driver.", { id: toastId });
    }
  }

  async function deleteDriver(id) {
    toast(
      (t) => (
        <div className="flex flex-col space-y-2">
          <span>Are you sure you want to delete this driver?</span>
          <div className="flex gap-2 justify-end">
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white"
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = toast.loading("Deleting driver...");
                try {
                  const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
                  const data = await res.json();
                  if (data.success) {
                    if (editingId === id) { setEditingId(null); setEditValues(null); }
                    toast.success("Driver deleted successfully.", { id: toastId });
                    fetchDrivers();
                  } else {
                    toast.error("Failed to delete driver.", { id: toastId });
                  }
                } catch {
                  toast.error("Error deleting driver.", { id: toastId });
                }
              }}>Yes</Button>
            <Button size="sm" variant="outline" onClick={() => toast.dismiss(t.id)}>No</Button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Driver Management</h1>
        <div className="flex items-center gap-2">
          <Link href="/drivers/add?from=drivers"><Button>Add Driver</Button></Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by full name"
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-left">Driver</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4 flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-500">
                    <p className="mb-3">No drivers found.</p>
                    <Link href="/drivers/add?from=drivers"><Button size="sm">Add Driver</Button></Link>
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      {editingId === d.id ? (
                        <Input value={editValues?.name || ""} onChange={(e) => setEditValues((s) => ({ ...s, name: e.target.value }))} className="max-w-[200px]" />
                      ) : (
                        <span className="font-medium text-gray-900">{d.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {editingId === d.id ? (
                        <Input value={editValues?.phone || ""} onChange={(e) => setEditValues((s) => ({ ...s, phone: e.target.value }))} className="max-w-[160px]" />
                      ) : (
                        <span className="text-gray-600">{d.phone || <span className="text-gray-300">—</span>}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {d.joinDate ? new Date(d.joinDate).toLocaleDateString("default", { year: "numeric", month: "short", day: "numeric" }) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {editingId === d.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit} className="bg-green-500 hover:bg-green-600 text-white gap-1">
                              <Save className="w-3.5 h-3.5" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(d)} title="Edit">
                              <Pencil className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteDriver(d.id)} title="Delete">
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
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </Card>
          ))
        ) : drivers.length === 0 ? (
          <Card>
            <div className="py-14 text-center">
              <p className="text-gray-500 mb-3">No drivers found.</p>
              <Link href="/drivers/add?from=drivers"><Button>Add Driver</Button></Link>
            </div>
          </Card>
        ) : (
          drivers.map((d) => (
            <Card key={d.id}>
              <div className="p-4">
                {editingId === d.id ? (
                  <div className="space-y-3">
                    <div><label className="text-xs text-muted-foreground mb-1 block">Name</label>
                      <Input value={editValues?.name || ""} onChange={(e) => setEditValues((s) => ({ ...s, name: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                      <Input value={editValues?.phone || ""} onChange={(e) => setEditValues((s) => ({ ...s, phone: e.target.value }))} /></div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={saveEdit} className="bg-green-500 hover:bg-green-600 text-white gap-1">
                        <Save className="w-3.5 h-3.5" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">{d.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{d.phone || "—"}</span>
                      {d.joinDate && <span>Joined {new Date(d.joinDate).toLocaleDateString("default", { year: "numeric", month: "short" })}</span>}
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(d)}>
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteDriver(d.id)}>
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
