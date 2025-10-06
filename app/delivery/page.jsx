"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Pencil, Trash2, Save } from "lucide-react";
import BackToDashboardButton from "@/components/BackToDashboardButton";
import DeliveryImg from "@/assets/delivery_img.png";

export default function DeliveryPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);

  // driver search state
  const [driverQuery, setDriverQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverSuggestionsVisible, setDriverSuggestionsVisible] =
    useState(false);

  const itemsPerPage = 4;

  // ----------------------------
  // 🔹 Fetch deliveries
  // ----------------------------
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const res = await fetch("/api/deliveries");
        const json = await res.json();
        if (json.success) {
          setDeliveries(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch deliveries:", err);
      }
    };
    fetchDeliveries();
  }, []);

  // ----------------------------
  // 🔹 Fetch drivers
  // ----------------------------
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch("/api/drivers");
        const json = await res.json();
        if (json.success) {
          setDrivers(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch drivers:", err);
      }
    };
    fetchDrivers();
  }, []);

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
      } else {
        alert("Failed to update delivery");
      }
    } catch (err) {
      console.error("Error saving delivery:", err);
    }
  }

  async function deleteDelivery(id) {
    if (!confirm("Are you sure you want to delete this delivery?")) return;
    try {
      const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeliveries((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert("Failed to delete delivery");
      }
    } catch (err) {
      console.error("Error deleting delivery:", err);
    }
  }

  // ----------------------------
  // 🔹 Filtering + Pagination
  // ----------------------------
  const filteredData = useMemo(() => {
    let result = [...deliveries];

    // status filter
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    // driver filter
    if (driverFilter !== "all") {
      result = result.filter((d) => String(d.driver?.id) === driverFilter);
    }

    // search
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
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ----------------------------
  // 🔹 Status Badge UI
  // ----------------------------
  const StatusBadge = ({ status }) => {
    let style = "";
    if (status === "delivered") style = "bg-green-500 text-white";
    if (status === "pending") style = "bg-yellow-500 text-white";
    if (status === "dispatched") style = "bg-blue-500 text-white";
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* ----------------- Header ----------------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image
            src={DeliveryImg}
            width={70}
            height={70}
            alt="delivery page logo"
          />
          Deliveries
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/drivers/add">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-md">
              Add Driver
            </Button>
          </Link>
          <Link href="/delivery/add">
            <Button className="bg-orange-500 hover:bg-orange-600 text-md">
              Add Delivery
            </Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* ----------------- Filters ----------------- */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
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

        {/* Driver Filter */}
        <Select value={driverFilter} onValueChange={(v) => setDriverFilter(v)}>
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
        <div className="relative w-[250px]">
          <Input
            placeholder="Search by ID, customer, or address"
            className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* ----------------- Table ----------------- */}
      <Card>
        <CardContent>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>#{d.id}</TableCell>
                    <TableCell>{d.customer?.name}</TableCell>
                    <TableCell>{d.customer?.phone}</TableCell>
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
                            <SelectItem value="dispatched">
                              Dispatched
                            </SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
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
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No deliveries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* ----------------- Pagination ----------------- */}
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
