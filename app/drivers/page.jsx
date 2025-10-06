"use client";

import Link from "next/link";
import Image from "next/image";
import DriverImg from "@/assets/product_img.png"; // reuse image or add a driver one
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const router = useRouter();

  // fetch drivers
  useEffect(() => {
    async function fetchDrivers() {
      try {
        const res = await fetch("/api/drivers");
        const data = await res.json();
        if (data?.success) {
          setDrivers(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching drivers:", err);
      }
    }
    fetchDrivers();
  }, []);

  // ----------------------------
  // Inline Editing
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
    try {
      const res = await fetch(`/api/drivers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editValues.name,
          phone: editValues.phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDrivers((prev) =>
          prev.map((d) => (d.id === editingId ? { ...d, ...editValues } : d))
        );
        cancelEdit();
      } else {
        alert("Failed to update driver");
      }
    } catch (err) {
      console.error("Error saving driver:", err);
    }
  }

  // ----------------------------
  // Delete
  // ----------------------------
  async function deleteDriver(id) {
    if (!confirm("Are you sure you want to delete this driver?")) return;

    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDrivers((prev) => prev.filter((d) => d.id !== id));
        if (editingId === id) cancelEdit();
      } else {
        alert("Failed to delete driver");
      }
    } catch (err) {
      console.error("Error deleting driver:", err);
    }
  }

  // ----------------------------
  // Search & Pagination
  // ----------------------------
  const filteredData = useMemo(() => {
    let result = [...drivers];
    if (searchQuery) {
      result = result.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [drivers, searchQuery]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={DriverImg} width={100} height={100} alt="drivers logo" />
          Driver Management
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/drivers/add">
            <Button className="bg-orange-500 hover:bg-orange-600 text-md">
              Add Driver
            </Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>
      {/* Search */}
      <div className="relative w-[250px]">
        <Input
          placeholder="Search by full name"
          className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      </div>
      {/* Table */}
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
              {paginatedData.length > 0 ? (
                paginatedData.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.id}</TableCell>
                    <TableCell>
                      {editingId === d.id ? (
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
                        d.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === d.id ? (
                        <Input
                          value={editValues?.phone || ""}
                          onChange={(e) =>
                            setEditValues((s) => ({
                              ...s,
                              phone: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        d.phone
                      )}
                    </TableCell>
                    <TableCell>
                      {d.joinDate
                        ? new Date(d.joinDate).toLocaleDateString("default", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {editingId === d.id ? (
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
                            onClick={() => startEdit(d)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteDriver(d.id)}
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
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No drivers found.
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
