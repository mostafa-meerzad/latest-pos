"use client";

import Link from "next/link";
import Image from "next/image";
import DriverImg from "@/assets/product_img.png"; // reuse image or add a driver one
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { set } from "zod";

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  // fetch drivers
  useEffect(() => {
    async function fetchDrivers() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/drivers");
        const data = await res.json();
        if (data?.success) {
          setDrivers(data.data || []);
          setIsLoading(false);
        } else {
          toast.error("Failed to fetch drivers.");
        }
      } catch (err) {
        toast.error("Error fetching drivers.");
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

    const toastId = toast.loading("Saving changes...");
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
        toast.success("Driver updated successfully!", { id: toastId });
      } else {
        toast.error("Failed to update driver.", { id: toastId });
      }
    } catch (err) {
      toast.error("Error saving driver.", { id: toastId });
    }
  }

  // ----------------------------
  // Delete
  // ----------------------------
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
                  const res = await fetch(`/api/drivers/${id}`, {
                    method: "DELETE",
                  });
                  const data = await res.json();
                  if (data.success) {
                    setDrivers((prev) => prev.filter((d) => d.id !== id));
                    if (editingId === id) cancelEdit();
                    toast.success("Driver deleted successfully.", {
                      id: toastId,
                    });
                  } else {
                    toast.error("Failed to delete driver.", { id: toastId });
                  }
                } catch (err) {
                  toast.error("Error deleting driver.", { id: toastId });
                }
              }}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.dismiss(t.id)}
            >
              No
            </Button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
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
          <Link href="/drivers/add?from=drivers">
            <Button className="bg-orange-500 hover:bg-orange-600 text-md ">
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
                {paginatedData.length > 0
                  ? paginatedData.map((d) => (
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
                            ? new Date(d.joinDate).toLocaleDateString(
                                "default",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : ""}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          {editingId === d.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={saveEdit}
                                className={
                                  "bg-green-400 hover:bg-green-300 hover:text-green-800"
                                }
                              >
                                <Save className="w-4 h-4" /> Save
                              </Button>
                              <Button
                                className={
                                  "hover:bg-gray-300 hover:text-gray-700"
                                }
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  cancelEdit();
                                  toast("Edit canceled.", { icon: "🚫" });
                                }}
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
                                className={
                                  "hover:bg-gray-300 hover:text-gray-700"
                                }
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                className={
                                  "hover:bg-red-300 hover:text-red-800"
                                }
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
                  : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {/* ----------------- Pagination ----------------- */}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 items-center">
          {/* Prev Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </Button>

          {/* Page Numbers */}
          {[...Array(3)].map((_, i) => {
            let pageNumber;
            if (currentPage === 1) {
              pageNumber = i + 1;
            } else if (currentPage === totalPages) {
              pageNumber = totalPages - 2 + i;
            } else {
              pageNumber = currentPage - 1 + i;
            }

            if (pageNumber < 1 || pageNumber > totalPages) return null;

            return (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                className={
                  pageNumber === currentPage ? "bg-orange-500 text-white" : ""
                }
                size="sm"
                onClick={() => goToPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function DriversTableSkeleton() {
  return (
    <Card className="p-4 overflow-x-auto">
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 border-b pb-3 px-4 text-sm font-medium text-muted-foreground">
          <div>ID</div>
          <div>Name</div>
          <div>Phone</div>
          <div>Join Date</div>
          <div>Actions</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-5 gap-4 items-center px-4 py-3"
            >
              {/* ID */}
              <Skeleton className="h-4 w-6" />

              {/* Name */}
              <Skeleton className="h-4 w-32" />

              {/* Phone */}
              <Skeleton className="h-4 w-28" />

              {/* Join Date */}
              <Skeleton className="h-4 w-24" />

              {/* Actions */}
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
