"use client";

import DeliveryImg from "@/assets/delivery_img.png";
import BackToDashboardButton from "@/components/BackToDashboardButton";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Save, Search, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast"; // ✅ Added Toaster import
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DeliveryPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [driverQuery, setDriverQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverSuggestionsVisible, setDriverSuggestionsVisible] =
    useState(false);

  const itemsPerPage = 6;

  // ----------------------------
  // 🔹 Fetch deliveries with filters
  // ----------------------------
  useEffect(() => {
    const fetchDeliveries = async () => {
      setLoading(true);
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          status: statusFilter,
          driver: driverFilter,
        });

        const res = await fetch(`/api/deliveries?${params.toString()}`);
        const json = await res.json();

        if (json.success) {
          setDeliveries(json.data);
          setTotalPages(json.pagination.totalPages);
          setTotalCount(json.pagination.total);
        } else {
          console.error("Failed to fetch deliveries:", json.error);
          setDeliveries([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } catch (err) {
        console.error("Failed to fetch deliveries:", err);
        setDeliveries([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveries();
  }, [currentPage, searchQuery, statusFilter, driverFilter]);

  // ---------------- Fetch Drivers ----------------
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch("/api/drivers");
        const json = await res.json();
        if (json.success) {
          setDrivers(json.data);
        } else {
          toast.error("Failed to fetch drivers.");
        }
      } catch {
        toast.error("Error fetching drivers.");
      }
    };
    fetchDrivers();
  }, []);

  // ----------------------------
  // 🔹 Reset to page 1 when filters change
  // ----------------------------
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, driverFilter]);

  // ----------------------------
  // 🔹 Inline Editing Functions
  // ----------------------------
  function startEdit(row) {
    setEditingId(row.id);
    setEditValues({
      status: row.status,
      driverId: row.driver?.id || null,
      deliveryAddress: row.deliveryAddress || "",
      deliveryDate: row.deliveryDate
        ? new Date(row.deliveryDate).toISOString().split("T")[0]
        : "",
      deliveryFee: row.deliveryFee || 0,
      customerPhone: row.customerPhone || null,
    });
    setDriverQuery(
      row.driver?.name ? `${row.driver.name} – ${row.driver.phone}` : ""
    );
    setSelectedDriver(row.driver || null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
    setDriverQuery("");
    setSelectedDriver(null);
  }

  async function saveEdit() {
    if (!editingId || !editValues) return;

    const fee = Number(editValues.deliveryFee);
    if (!Number.isInteger(fee) || fee < 0) {
      toast.error("Delivery fee must be a non-negative whole number.");
      return;
    }

    const toastId = toast.loading("Updating delivery...");
    try {
      const res = await fetch(`/api/deliveries/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh the data after successful edit
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          status: statusFilter,
          driver: driverFilter,
        });
        const refreshRes = await fetch(`/api/deliveries?${params.toString()}`);
        const refreshData = await refreshRes.json();

        if (refreshData.success) {
          setDeliveries(refreshData.data);
        }
        cancelEdit();
        toast.success("Delivery updated successfully.", { id: toastId });
      } else {
        toast.error("Failed to update delivery.", { id: toastId });
      }
    } catch {
      toast.error("Error saving delivery.", { id: toastId });
    }
  }

  async function deleteDelivery(id) {
    if (!confirm("Are you sure you want to delete this delivery?")) return;
    try {
      const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        // Refresh the data after successful deletion
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          status: statusFilter,
          driver: driverFilter,
        });
        const refreshRes = await fetch(`/api/deliveries?${params.toString()}`);
        const refreshData = await refreshRes.json();

        if (refreshData.success) {
          setDeliveries(refreshData.data);
          setTotalPages(refreshData.pagination.totalPages);
          setTotalCount(refreshData.pagination.total);

          // Adjust current page if we deleted the last item on the page
          if (refreshData.data.length === 0 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        }
      } else {
        alert("Failed to delete delivery");
      }
    } catch (err) {
      console.error("Error deleting delivery:", err);
    }
  }

  // ----------------------------
  // 🔹 Pagination
  // ----------------------------
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 3;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    buttons.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Prev
      </Button>
    );

    // First page and ellipsis if needed
    if (startPage > 1) {
      buttons.push(
        <Button key={1} variant="outline" size="sm" onClick={() => goToPage(1)}>
          1
        </Button>
      );
      if (startPage > 2) {
        buttons.push(
          <Button key="ellipsis1" variant="outline" size="sm" disabled>
            ...
          </Button>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          className={i === currentPage ? "bg-orange-500 text-white" : ""}
          size="sm"
          onClick={() => goToPage(i)}
        >
          {i}
        </Button>
      );
    }

    // Last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <Button key="ellipsis2" variant="outline" size="sm" disabled>
            ...
          </Button>
        );
      }
      buttons.push(
        <Button
          key={totalPages}
          variant="outline"
          size="sm"
          onClick={() => goToPage(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    // Next button
    buttons.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    );

    return buttons;
  };

  const StatusBadge = ({ status }) => {
    let style = "";
    if (status === "delivered") style = "bg-green-500 text-white";
    if (status === "pending") style = "bg-yellow-500 text-white";
    // if (status === "dispatched") style = "bg-blue-500 text-white";
    if (status === "canceled") style = "bg-red-500 text-white";
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image
            src={DeliveryImg}
            width={70}
            height={70}
            alt="delivery page logo"
            className="rounded-md"
          />
          Deliveries
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/drivers/add?from=deliveries">
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-md">
              Add Driver
            </Button>
          </Link>
          <Link href="/delivery/add?from=deliveries">
            <Button className="bg-orange-400 hover:bg-orange-500 text-md">
              Add Delivery
            </Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            toast.success(`Filtered by ${v === "all" ? "all statuses" : v}`);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            {/* <SelectItem value="dispatched">Dispatched</SelectItem> */}
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={driverFilter}
          onValueChange={(v) => {
            setDriverFilter(v);
            toast.success(
              v === "all" ? "Showing all drivers" : "Filtered by driver"
            );
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map((drv) => (
              <SelectItem key={drv.id} value={String(drv.id)}>
                {drv.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative w-[270px]">
          <Input
            placeholder="Search by ID, customer, or address"
            className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => {
              if (searchQuery) toast(`Searching for "${searchQuery}"`);
            }}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* ----------------- Info Text ----------------- */}
      {/* {!loading && (
        <div className="text-sm text-gray-600">
          Showing {deliveries.length} of {totalCount} deliveries
          {(searchQuery || statusFilter !== "all" || driverFilter !== "all") &&
            " (filtered)"}
        </div>
      )} */}

      {/* ----------------- Table ----------------- */}
      <Card className={loading ? "p-0" : ""}>
        <CardContent className={loading ? "p-0" : ""}>
          {loading ? (
            <Card className="p-4 rounded-2xl border-none shadow-sm border">
              <table className="min-w-full text-lg">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">
                      Order ID
                    </th>
                    <th className="text-left py-2 px-3 font-medium">
                      Customer
                    </th>
                    <th className="text-left py-2 px-3 font-medium">Phone</th>
                    <th className="text-left py-2 px-3 font-medium">Address</th>
                    <th className="text-left py-2 px-3 font-medium">Driver</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">
                      Delivery Date
                    </th>
                    <th className="text-left py-2 px-3 font-medium">
                      Delivery Fee
                    </th>
                    <th className="text-left py-2 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-10" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-8 w-24 rounded-lg" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-lg">
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Delivery Fee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.length > 0 ? (
                  deliveries.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>#{d.id}</TableCell>
                      <TableCell>{d.customer?.name}</TableCell>
                      {/* Phone number */}
                      <TableCell>
                        {editingId === d.id ? (
                          <Input
                            value={editValues?.customerPhone || ""}
                            onChange={(e) =>
                              setEditValues((s) => ({
                                ...s,
                                customerPhone: e.target.value,
                              }))
                            }
                            placeholder="Enter customer phone"
                            className="w-[220px]"
                          />
                        ) : (
                          d.customerPhone || "—"
                        )}
                      </TableCell>
                      {/* Address */}
                      <TableCell>
                        {editingId === d.id ? (
                          <Input
                            value={editValues?.deliveryAddress || ""}
                            onChange={(e) =>
                              setEditValues((s) => ({
                                ...s,
                                deliveryAddress: e.target.value,
                              }))
                            }
                            placeholder="Enter delivery address"
                            className="w-[220px]"
                          />
                        ) : (
                          d.deliveryAddress || "—"
                        )}
                      </TableCell>

                      {/* Driver */}
                      <TableCell>
                        {editingId === d.id ? (
                          <div className="relative w-[200px]">
                            <Input
                              placeholder="Search driver by name..."
                              value={driverQuery}
                              onChange={(e) => {
                                setDriverQuery(e.target.value);
                                setDriverSuggestionsVisible(true);
                              }}
                              onFocus={() => setDriverSuggestionsVisible(true)}
                              onBlur={() =>
                                setTimeout(
                                  () => setDriverSuggestionsVisible(false),
                                  150
                                )
                              }
                            />
                            {driverSuggestionsVisible && driverQuery && (
                              <div className="absolute z-20 bg-white border rounded w-full mt-1 max-h-40 overflow-auto">
                                {drivers
                                  .filter((drv) =>
                                    drv.name
                                      .toLowerCase()
                                      .includes(driverQuery.toLowerCase())
                                  )
                                  .map((drv) => (
                                    <div
                                      key={drv.id}
                                      className="p-2 hover:bg-slate-50 cursor-pointer"
                                      onMouseDown={() => {
                                        setSelectedDriver(drv);
                                        setEditValues((s) => ({
                                          ...s,
                                          driverId: drv.id,
                                        }));
                                        setDriverQuery(
                                          `${drv.name} – ${drv.phone}`
                                        );
                                        setDriverSuggestionsVisible(false);
                                      }}
                                    >
                                      {drv.name} – {drv.phone}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          d.driver?.name || "—"
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {editingId === d.id ? (
                          <Select
                            value={editValues?.status || d.status}
                            onValueChange={(v) =>
                              setEditValues((s) => ({ ...s, status: v }))
                            }
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              {/* <SelectItem value="dispatched">
                                Dispatched
                              </SelectItem> */}
                              <SelectItem value="delivered">
                                Delivered
                              </SelectItem>
                              <SelectItem value="canceled">Canceled</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <StatusBadge status={d.status} />
                        )}
                      </TableCell>

                      {/* Delivery Date */}
                      <TableCell>
                        {editingId === d.id ? (
                          <Input
                            type="date"
                            value={editValues?.deliveryDate || ""}
                            onChange={(e) =>
                              setEditValues((s) => ({
                                ...s,
                                deliveryDate: e.target.value,
                              }))
                            }
                          />
                        ) : d.deliveryDate ? (
                          new Date(d.deliveryDate).toLocaleDateString()
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Delivery Fee */}
                      <TableCell>
                        {editingId === d.id ? (
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={editValues?.deliveryFee || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              // ✅ Prevent negative or decimal values
                              if (!/^\d*$/.test(value)) return;
                              setEditValues((s) => ({
                                ...s,
                                deliveryFee: value ? parseInt(value, 10) : 0,
                              }));
                            }}
                            placeholder="Enter fee"
                            className="w-[100px]"
                          />
                        ) : (
                          d.deliveryFee ?? "—"
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="flex gap-2 ml-2">
                        {editingId === d.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit}>
                              <Save className="w-4 h-4" />
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
                              onClick={() => deleteDelivery(d.id)}
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
                      colSpan={9}
                      className="text-center text-gray-500"
                    >
                      No deliveries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ----------------- Pagination ----------------- */}
      {totalPages > 1 && (
        <div className="flex gap-2 items-center flex-wrap">
          {renderPaginationButtons()}
        </div>
      )}
    </div>
  );
}
