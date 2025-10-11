"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const itemsPerPage = 6;

  // 🔹 Fetch suppliers
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await fetch("/api/suppliers");
        const json = await res.json();
        if (json?.data) setSuppliers(json.data);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    }
    fetchSuppliers();
  }, []);

  // 🔹 Inline Editing
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

    // Build payload with only editable fields (avoid sending products, id, etc)
    const payload = {
      name: editValues.name ?? undefined,
      contactPerson: editValues.contactPerson ?? undefined,
      phone: editValues.phone ?? undefined,
      email: editValues.email ?? undefined,
      address: editValues.address ?? undefined,
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        // use server's returned supplier to keep state consistent
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingId ? data.data : s))
        );
        cancelEdit();
      } else {
       

        // 🔹 Extract readable error message
        let errMsg = "Update failed";

        if (data.error?.message) {
          errMsg = data.error.message;
        } else if (data.error?.fieldErrors) {
          // get first key’s first error message
          const firstKey = Object.keys(data.error.fieldErrors)[0];
          errMsg = data.error.fieldErrors[firstKey][0];
        }

        alert(errMsg);
      }
    } catch (err) {
      console.error("Network error saving supplier:", err);
      alert("Network error while saving supplier");
    } finally {
      setSaving(false);
    }
  }

  // 🔹 Delete (set status to INACTIVE)
  async function deleteSupplier(id) {
    if (!confirm("Are you sure you want to deactivate this supplier?")) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Failed to deactivate supplier");
      }
    } catch (err) {
      console.error("Error deleting supplier:", err);
    }
  }

  // 🔹 Filtering
  const filteredData = useMemo(() => {
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [suppliers, searchQuery]);

  // 🔹 Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // -------------------- UI --------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={SupplierImg} width={80} height={80} alt="suppliers" />
          Supplier Management
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="outline" className={"drop-shadow-2xl"}>
              Back to Products
            </Button>
          </Link>

          <Link href="/suppliers/add-supplier">
            <Button className="bg-amber-500 hover:bg-amber-600 text-md drop-shadow-2xl">
              Add Supplier
            </Button>
          </Link>

          <BackToDashboardButton />
        </div>
      </div>
      {/* Search */}
      <div className="flex gap-3">
        <div className="relative w-[300px]">
          <Input
            placeholder="Search by supplier name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </div>
      {/* Table */}
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
              {paginatedData.length > 0 ? (
                paginatedData.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>

                    {/* Name */}
                    <TableCell>
                      {editingId === s.id ? (
                        <Input
                          value={editValues?.name || ""}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        s.name
                      )}
                    </TableCell>

                    {/* Contact Person */}
                    <TableCell>
                      {editingId === s.id ? (
                        <Input
                          value={editValues?.contactPerson || ""}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              contactPerson: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        s.contactPerson
                      )}
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      {editingId === s.id ? (
                        <Input
                          value={editValues?.phone || ""}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        s.phone
                      )}
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      {editingId === s.id ? (
                        <Input
                          type="email"
                          value={editValues?.email || ""}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        s.email
                      )}
                    </TableCell>

                    {/* Address */}
                    <TableCell>
                      {editingId === s.id ? (
                        <Input
                          value={editValues?.address || ""}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        s.address
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="flex gap-2">
                      {editingId === s.id ? (
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
                            onClick={() => startEdit(s)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteSupplier(s.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-gray-500 py-6"
                  >
                    No suppliers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Pagination */}
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
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              variant={i + 1 === currentPage ? "default" : "outline"}
              className={
                i + 1 === currentPage ? "bg-orange-500 text-white" : ""
              }
              size="sm"
              onClick={() => goToPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
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
