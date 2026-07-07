"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2, Save } from "lucide-react";
import Link from "next/link";
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
import SupplierImg from "@/assets/suppliers_img.png";
import PaginationBar from "@/components/PaginationBar";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
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
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingId ? data.data : s))
        );
        cancelEdit();
        toast.dismiss();
        toast.success("Supplier updated successfully!");
      } else {
        let errMsg = "Update failed";
        if (data.error?.message) errMsg = data.error.message;
        else if (data.error?.fieldErrors) {
          const firstKey = Object.keys(data.error.fieldErrors)[0];
          errMsg = data.error.fieldErrors[firstKey][0];
        }
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
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
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
              }}
            >
              Yes
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>No</Button>
          </div>
        </div>
      ),
      { duration: 5000, position: "top-center" }
    );
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={SupplierImg} width={80} height={80} alt="suppliers" />
          Supplier Management
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="outline">Back to Products</Button>
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/suppliers/add-supplier">
              <Button className="bg-amber-500 hover:bg-amber-600 text-md">Add Supplier</Button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <BackToDashboardButton />
          </motion.div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="relative w-[300px]">
          <Input
            placeholder="Search by supplier name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <SuppliersTableSkeleton />
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-lg">
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {suppliers.length > 0 ? (
                    suppliers.map((s) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TableCell>{s.id}</TableCell>
                        <TableCell>
                          {editingId === s.id ? (
                            <Input value={editValues?.name || ""} onChange={(e) => setEditValues((p) => ({ ...p, name: e.target.value }))} />
                          ) : s.name}
                        </TableCell>
                        <TableCell>
                          {editingId === s.id ? (
                            <Input value={editValues?.contactPerson || ""} onChange={(e) => setEditValues((p) => ({ ...p, contactPerson: e.target.value }))} />
                          ) : s.contactPerson}
                        </TableCell>
                        <TableCell>
                          {editingId === s.id ? (
                            <Input value={editValues?.phone || ""} onChange={(e) => setEditValues((p) => ({ ...p, phone: e.target.value }))} />
                          ) : s.phone}
                        </TableCell>
                        <TableCell>
                          {editingId === s.id ? (
                            <Input type="email" value={editValues?.email || ""} onChange={(e) => setEditValues((p) => ({ ...p, email: e.target.value }))} />
                          ) : s.email}
                        </TableCell>
                        <TableCell>
                          {editingId === s.id ? (
                            <Input value={editValues?.address || ""} onChange={(e) => setEditValues((p) => ({ ...p, address: e.target.value }))} />
                          ) : s.address}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          {editingId === s.id ? (
                            <>
                              <Button size="sm" disabled={saving} onClick={saveEdit} className="bg-green-400 hover:bg-green-300 hover:text-green-800">
                                <Save className="w-4 h-4" /> Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { toast("Edit canceled."); cancelEdit(); }} className="hover:bg-gray-300 hover:text-gray-700">
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => startEdit(s)} className="hover:bg-gray-300 hover:text-gray-700">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteSupplier(s.id)} className="hover:bg-red-300 hover:text-red-800">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                        No suppliers found.
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </motion.div>
  );
}

function SuppliersTableSkeleton() {
  const rows = Array.from({ length: 6 });
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="text-lg">
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((_, i) => (
                <motion.tr key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
