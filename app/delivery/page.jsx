"use client";

import DeliveryImg from "@/assets/delivery_img.png";
import BackToDashboardButton from "@/components/BackToDashboardButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { Pencil, Save, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast"; // ✅ Added Toaster import

export default function DeliveryPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [driverQuery, setDriverQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverSuggestionsVisible, setDriverSuggestionsVisible] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 4;

  // ---------------- Fetch Deliveries ----------------
  useEffect(() => {
    const fetchDeliveries = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/deliveries");
        const json = await res.json();
        if (json.success) {
          setDeliveries(json.data);
          // toast.success("Deliveries loaded successfully.");
          setIsLoading(false);
        } else {
          toast.error("Failed to fetch deliveries.");
        }
      } catch {
        toast.error("Error fetching deliveries.");
      }
    };
    fetchDeliveries();
  }, []);

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
        setDeliveries((prev) =>
          prev.map((d) => (d.id === editingId ? { ...d, ...data.data } : d))
        );
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
    toast(
      (t) => (
        <div className="flex flex-col space-y-2">
          <span>Are you sure you want to delete this delivery?</span>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              className={"bg-red-500 hover:bg-red-600 text-white"}
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = toast.loading("Deleting...");
                try {
                  const res = await fetch(`/api/deliveries/${id}`, {
                    method: "DELETE",
                  });
                  const data = await res.json();
                  if (data.success) {
                    setDeliveries((prev) => prev.filter((d) => d.id !== id));
                    toast.success("Delivery deleted successfully.", {
                      id: toastId,
                    });
                  } else {
                    toast.error("Failed to delete delivery.", { id: toastId });
                  }
                } catch {
                  toast.error("Error deleting delivery.", { id: toastId });
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

  // ---------------- Filtering & Pagination ----------------
  const filteredData = useMemo(() => {
    let result = [...deliveries];
    if (statusFilter !== "all")
      result = result.filter((d) => d.status === statusFilter);
    if (driverFilter !== "all")
      result = result.filter((d) => String(d.driver?.id) === driverFilter);
    if (searchQuery) {
      result = result.filter(
        (d) =>
          String(d.id).includes(searchQuery) ||
          d.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [deliveries, statusFilter, driverFilter, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      toast(`Moved to page ${page}`);
    }
  };

  const StatusBadge = ({ status }) => {
    let style = "";
    if (status === "delivered") style = "bg-green-500 text-white";
    if (status === "pending") style = "bg-yellow-500 text-white";
    if (status === "dispatched") style = "bg-blue-500 text-white";
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
            <SelectItem value="dispatched">Dispatched</SelectItem>
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

        <div className="relative w-[250px]">
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

      {/* ----------------- Table ----------------- */}

      {isLoading ? (
        <OrdersTableSkeleton />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="text-lg font-semibold text-muted-foreground">
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
                {paginatedData.length > 0 ? (
                  paginatedData.map((d) => (
                    <motion.tr
                      key={d.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className={`border-b ${
                        editingId === d.id
                          ? "bg-orange-50 dark:bg-orange-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <TableCell>#{d.id}</TableCell>
                      <TableCell>{d.customer?.name}</TableCell>

                      {/* Phone */}
                      <TableCell className="max-w-[230px]">
                        <motion.div
                          key={editingId === d.id ? "edit-phone" : "view-phone"}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
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
                              className="w-full min-w-[200px]"
                            />
                          ) : (
                            d.customerPhone || "—"
                          )}
                        </motion.div>
                      </TableCell>

                      {/* Address */}
                      <TableCell className="max-w-[260px] truncate">
                        <motion.div
                          key={
                            editingId === d.id ? "edit-address" : "view-address"
                          }
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
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
                              className="w-full min-w-[240px]"
                            />
                          ) : (
                            d.deliveryAddress || "—"
                          )}
                        </motion.div>
                      </TableCell>

                      {/* Driver */}
                      <TableCell className="min-w-[220px]">
                        <motion.div
                          key={
                            editingId === d.id ? "edit-driver" : "view-driver"
                          }
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {editingId === d.id ? (
                            <div className="relative">
                              <Input
                                placeholder="Search driver by name..."
                                value={driverQuery}
                                onChange={(e) => {
                                  setDriverQuery(e.target.value);
                                  setDriverSuggestionsVisible(true);
                                }}
                                onFocus={() =>
                                  setDriverSuggestionsVisible(true)
                                }
                                onBlur={() =>
                                  setTimeout(
                                    () => setDriverSuggestionsVisible(false),
                                    150
                                  )
                                }
                              />
                              {driverSuggestionsVisible && driverQuery && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  className="absolute z-20 bg-white dark:bg-slate-900 border rounded w-full mt-1 max-h-40 overflow-auto shadow-md"
                                >
                                  {drivers
                                    .filter((drv) =>
                                      drv.name
                                        .toLowerCase()
                                        .includes(driverQuery.toLowerCase())
                                    )
                                    .map((drv) => (
                                      <div
                                        key={drv.id}
                                        className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
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
                                </motion.div>
                              )}
                            </div>
                          ) : (
                            d.driver?.name || "—"
                          )}
                        </motion.div>
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
                              <SelectItem value="dispatched">
                                Dispatched
                              </SelectItem>
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
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              className={
                                "bg-green-400 hover:bg-green-300 hover:text-green-800"
                              }
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              className={
                                "hover:bg-gray-200 hover:text-gray-800"
                              }
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                cancelEdit();
                                toast("Edit canceled.");
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
                              className={"hover:bg-red-300 hover:text-red-800"}
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteDelivery(d.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-500"
                  >
                    <TableCell colSpan={8}>No deliveries found.</TableCell>
                  </motion.tr>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OrdersTableSkeleton() {
  return (
    <Card className="mt-6 ">
      <CardContent className="overflow-x-auto p-4">
        <table className="min-w-full -mt-5">
          <thead>
            <tr className="text-lg font-semibold text-muted-foreground">
              <th className="py-2 text-left">Order ID</th>
              <th className="py-2 text-left">Customer</th>
              <th className="py-2 text-left">Phone</th>
              <th className="py-2 text-left">Address</th>
              <th className="py-2 text-left">Driver</th>
              <th className="py-2 text-left ">Status</th>
              <th className="py-2 text-left">Delivery Date</th>
              <th className="py-2 text-left">Delivery Fee</th>
              <th className="py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">
                  <Skeleton className="h-5 w-10" />
                </td>
                <td className="py-2">
                  <Skeleton className="h-5 w-28" />
                </td>
                <td className="py-2">
                  <Skeleton className="h-5 w-24" />
                </td>
                <td className="py-2">
                  <Skeleton className="h-5 w-32" />
                </td>
                <td className="py-2">
                  <Skeleton className="h-5 w-20" />
                </td>
                <td className="py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="py-2">
                  <Skeleton className="h-5 w-20" />
                </td>
                <td className="py-2">
                  <Skeleton className="h-5 w-10" />
                </td>
                <td className="py-3 text-center flex justify-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
