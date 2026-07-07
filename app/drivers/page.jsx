"use client";

import Link from "next/link";
import Image from "next/image";
import DriverImg from "@/assets/product_img.png";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, Save } from "lucide-react";
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
        cancelEdit();
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
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = toast.loading("Deleting driver...");
                try {
                  const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
                  const data = await res.json();
                  if (data.success) {
                    if (editingId === id) cancelEdit();
                    toast.success("Driver deleted successfully.", { id: toastId });
                    fetchDrivers();
                  } else {
                    toast.error("Failed to delete driver.", { id: toastId });
                  }
                } catch {
                  toast.error("Error deleting driver.", { id: toastId });
                }
              }}
            >
              Yes
            </Button>
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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={DriverImg} width={100} height={100} alt="drivers logo" />
          Driver Management
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/drivers/add?from=drivers">
            <Button>Add Driver</Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* Search */}
      <div className="relative w-[250px]">
        <Input
          placeholder="Search by full name"
          className="pr-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      </div>

      {/* Table */}
      {isLoading ? (
        <DriversTableSkeleton />
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-lg">
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.length > 0 ? (
                  drivers.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.id}</TableCell>
                      <TableCell>
                        {editingId === d.id ? (
                          <Input value={editValues?.name || ""} onChange={(e) => setEditValues((s) => ({ ...s, name: e.target.value }))} />
                        ) : d.name}
                      </TableCell>
                      <TableCell>
                        {editingId === d.id ? (
                          <Input value={editValues?.phone || ""} onChange={(e) => setEditValues((s) => ({ ...s, phone: e.target.value }))} />
                        ) : d.phone}
                      </TableCell>
                      <TableCell>
                        {d.joinDate ? new Date(d.joinDate).toLocaleDateString("default", { year: "numeric", month: "short", day: "numeric" }) : ""}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {editingId === d.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit} className="bg-green-400 hover:bg-green-300 hover:text-green-800">
                              <Save className="w-4 h-4" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { cancelEdit(); toast("Edit canceled.", { icon: "🚫" }); }} className="hover:bg-gray-300 hover:text-gray-700">
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => startEdit(d)} className="hover:bg-gray-300 hover:text-gray-700">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteDriver(d.id)} className="hover:bg-red-300 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-14 text-center">
                      <p className="text-gray-500 mb-3">No drivers found.</p>
                      <Link href="/drivers/add?from=drivers">
                        <Button>Add Driver</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

function DriversTableSkeleton() {
  return (
    <Card className="p-4 overflow-x-auto">
      <CardContent className="p-0">
        <div className="grid grid-cols-5 gap-4 border-b pb-3 px-4 text-sm font-medium text-muted-foreground">
          <div>ID</div><div>Name</div><div>Phone</div><div>Join Date</div><div>Actions</div>
        </div>
        <div className="divide-y">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 items-center px-4 py-3">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
