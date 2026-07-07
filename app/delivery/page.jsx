"use client";

import DeliveryImg from "@/assets/delivery_img.png";
import BackToDashboardButton from "@/components/BackToDashboardButton";
import PaginationBar from "@/components/PaginationBar";
import StatusBadge from "@/components/StatusBadge";
import { useState, useEffect, useRef } from "react";
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
import { Pencil, Printer, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import Delivery from "@/components/Delivery";
import { useReactToPrint } from "react-to-print";

export default function DeliveryPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [driverQuery, setDriverQuery] = useState("");
  const [driverSuggestionsVisible, setDriverSuggestionsVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [lastPrintedDelivery, setLastPrintedDelivery] = useState(null);
  const deliveryRef = useRef(null);
  const handlePrintDelivery = useReactToPrint({ contentRef: deliveryRef });

  const itemsPerPage = 25;

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((json) => {
      if (json.success) setUser(json.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchDeliveries = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          status: statusFilter,
          driver: driverFilter,
        });
        const res = await fetch(`/api/deliveries?${params}`);
        const json = await res.json();
        if (json.success) {
          setDeliveries(json.data);
          setTotalPages(json.pagination.totalPages);
        } else {
          setDeliveries([]);
          setTotalPages(1);
        }
      } catch {
        setDeliveries([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveries();
  }, [currentPage, searchQuery, statusFilter, driverFilter]);

  useEffect(() => {
    fetch("/api/drivers").then((r) => r.json()).then((json) => {
      if (json.success) setDrivers(json.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, driverFilter]);

  function startEdit(row) {
    setEditingId(row.id);
    setEditValues({
      status: row.status,
      driverId: row.driver?.id || null,
      deliveryAddress: row.deliveryAddress || "",
      deliveryDate: row.deliveryDate ? new Date(row.deliveryDate).toISOString().split("T")[0] : "",
      deliveryTime: row.deliveryDate ? new Date(row.deliveryDate).toTimeString().split(" ")[0].slice(0, 5) : "",
      deliveryFee: row.deliveryFee || 0,
      customerPhone: row.customerPhone || null,
    });
    setDriverQuery(row.driver?.name ? `${row.driver.name} – ${row.driver.phone}` : "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
    setDriverQuery("");
  }

  async function saveEdit() {
    if (!editingId || !editValues) return;
    const fee = Number(editValues.deliveryFee);
    if (!Number.isInteger(fee) || fee < 0) {
      toast.error("Delivery fee must be a non-negative whole number.");
      return;
    }
    const payload = { ...editValues };
    if (payload.deliveryDate && payload.deliveryTime) {
      payload.deliveryDate = new Date(`${payload.deliveryDate}T${payload.deliveryTime}`).toISOString();
    }
    const toastId = toast.loading("Updating delivery...");
    try {
      const res = await fetch(`/api/deliveries/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const params = new URLSearchParams({
          page: currentPage.toString(), limit: itemsPerPage.toString(),
          search: searchQuery, status: statusFilter, driver: driverFilter,
        });
        const refreshRes = await fetch(`/api/deliveries?${params}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) setDeliveries(refreshData.data);
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
    const confirmDelete = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <p>Are you sure you want to delete this delivery?</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => { toast.dismiss(t.id); resolve(true); }} className="bg-red-500 hover:bg-red-600 text-white">Yes</Button>
              <Button onClick={() => { toast.dismiss(t.id); resolve(false); }} variant="outline">Cancel</Button>
            </div>
          </div>
        ),
        { duration: Infinity, position: "top-center" }
      );
    });
    if (!confirmDelete) return;
    const toastId = toast.loading("Deleting delivery...");
    try {
      const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const params = new URLSearchParams({
          page: currentPage.toString(), limit: itemsPerPage.toString(),
          search: searchQuery, status: statusFilter, driver: driverFilter,
        });
        const refreshRes = await fetch(`/api/deliveries?${params}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setDeliveries(refreshData.data);
          setTotalPages(refreshData.pagination.totalPages);
          if (refreshData.data.length === 0 && currentPage > 1) setCurrentPage(currentPage - 1);
        }
        toast.success("Delivery deleted successfully!", { id: toastId });
      } else {
        toast.error("Failed to delete delivery.", { id: toastId });
      }
    } catch {
      toast.error("Something went wrong while deleting.", { id: toastId });
    }
  }

  useEffect(() => {
    if (lastPrintedDelivery && deliveryRef.current) {
      try { handlePrintDelivery(); } catch { toast.error("Failed to print delivery."); }
      finally { setLastPrintedDelivery(null); }
    }
  }, [lastPrintedDelivery, handlePrintDelivery]);

  function formatDateTime(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}`;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={DeliveryImg} width={60} height={60} alt="deliveries" className="rounded-md" />
          Deliveries
        </h1>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link href="/drivers/add?from=deliveries"><Button variant="outline">Add Driver</Button></Link>
          <Link href="/delivery/add?from=deliveries"><Button>Add Delivery</Button></Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Driver" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map((drv) => (
              <SelectItem key={drv.id} value={String(drv.id)}>{drv.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by ID, customer, or address"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Destination</th>
                <th className="px-5 py-3 text-left">Driver</th>
                <th className="px-5 py-3 text-left">Fee</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-32 mb-1.5" />
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-44 mb-1.5" />
                      <Skeleton className="h-3 w-28" />
                    </td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4 flex gap-2">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <p className="mb-3">No deliveries found.</p>
                    <Link href="/delivery/add?from=deliveries"><Button size="sm">Add Delivery</Button></Link>
                  </td>
                </tr>
              ) : (
                deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    {/* Customer: name + phone */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {d.customer?.name || "—"}
                        <span className="text-xs text-gray-400 font-normal ml-1.5">#{d.id}</span>
                      </p>
                      {editingId === d.id ? (
                        <Input
                          value={editValues?.customerPhone || ""}
                          onChange={(e) => setEditValues((s) => ({ ...s, customerPhone: e.target.value }))}
                          placeholder="Phone"
                          className="mt-1 w-[140px]"
                        />
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">{d.customerPhone || "No phone"}</p>
                      )}
                    </td>

                    {/* Destination: address + date */}
                    <td className="px-5 py-4 max-w-[220px]">
                      {editingId === d.id ? (
                        <div className="space-y-1.5">
                          <Textarea
                            value={editValues?.deliveryAddress || ""}
                            onChange={(e) => setEditValues((s) => ({ ...s, deliveryAddress: e.target.value }))}
                            placeholder="Address"
                            className="w-[200px] min-h-[60px]"
                          />
                          <div className="flex gap-1">
                            <Input type="date" value={editValues?.deliveryDate || ""} onChange={(e) => setEditValues((s) => ({ ...s, deliveryDate: e.target.value }))} className="w-[130px]" />
                            <Input type="time" value={editValues?.deliveryTime || ""} onChange={(e) => setEditValues((s) => ({ ...s, deliveryTime: e.target.value }))} className="w-[100px]" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-700 text-xs leading-snug line-clamp-2">{d.deliveryAddress || <span className="text-gray-300">No address</span>}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(d.deliveryDate)}</p>
                        </>
                      )}
                    </td>

                    {/* Driver */}
                    <td className="px-5 py-4">
                      {editingId === d.id ? (
                        <div className="relative w-[180px]">
                          <Input
                            placeholder="Search driver..."
                            value={driverQuery}
                            onChange={(e) => { setDriverQuery(e.target.value); setDriverSuggestionsVisible(true); }}
                            onFocus={() => setDriverSuggestionsVisible(true)}
                            onBlur={() => setTimeout(() => setDriverSuggestionsVisible(false), 150)}
                          />
                          {driverSuggestionsVisible && driverQuery && (
                            <div className="absolute z-20 bg-white border rounded w-full mt-1 max-h-40 overflow-auto shadow">
                              {drivers.filter((drv) => drv.name.toLowerCase().includes(driverQuery.toLowerCase())).map((drv) => (
                                <div key={drv.id} className="p-2 hover:bg-slate-50 cursor-pointer text-sm"
                                  onMouseDown={() => {
                                    setEditValues((s) => ({ ...s, driverId: drv.id }));
                                    setDriverQuery(`${drv.name} – ${drv.phone}`);
                                    setDriverSuggestionsVisible(false);
                                  }}>
                                  {drv.name} – {drv.phone}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-700">{d.driver?.name || <span className="text-gray-300">—</span>}</span>
                      )}
                    </td>

                    {/* Fee */}
                    <td className="px-5 py-4">
                      {editingId === d.id ? (
                        <Input
                          type="number" min="0" step="1"
                          value={editValues?.deliveryFee || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!/^\d*$/.test(value)) return;
                            setEditValues((s) => ({ ...s, deliveryFee: value ? parseInt(value, 10) : 0 }));
                          }}
                          placeholder="Fee"
                          className="w-[90px]"
                        />
                      ) : (
                        <span className="text-gray-700">{d.deliveryFee != null ? `AFN ${d.deliveryFee}` : <span className="text-gray-300">—</span>}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {editingId === d.id ? (
                        <Select value={editValues?.status || d.status} onValueChange={(v) => setEditValues((s) => ({ ...s, status: v }))}>
                          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <StatusBadge status={d.status} />
                      )}
                    </td>

                    {/* Actions */}
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
                            <Button size="sm" variant="ghost" onClick={() => setLastPrintedDelivery({ ...d })} title="Print">
                              <Printer className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(d)} title="Edit">
                              <Pencil className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button size="sm" variant="ghost" disabled={user?.role !== "ADMIN"} onClick={() => deleteDelivery(d.id)} title="Delete">
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
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 w-16 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </Card>
          ))
        ) : deliveries.length === 0 ? (
          <Card>
            <div className="py-14 text-center">
              <p className="text-gray-500 mb-3">No deliveries found.</p>
              <Link href="/delivery/add?from=deliveries"><Button>Add Delivery</Button></Link>
            </div>
          </Card>
        ) : (
          deliveries.map((d) => (
            <Card key={d.id}>
              <div className="p-4">
                {editingId === d.id ? (
                  <div className="space-y-3">
                    <div><label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                      <Input value={editValues?.customerPhone || ""} onChange={(e) => setEditValues((s) => ({ ...s, customerPhone: e.target.value }))} placeholder="Customer phone" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Address</label>
                      <Textarea value={editValues?.deliveryAddress || ""} onChange={(e) => setEditValues((s) => ({ ...s, deliveryAddress: e.target.value }))} placeholder="Delivery address" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Driver</label>
                      <div className="relative">
                        <Input placeholder="Search driver by name..." value={driverQuery}
                          onChange={(e) => { setDriverQuery(e.target.value); setDriverSuggestionsVisible(true); }}
                          onFocus={() => setDriverSuggestionsVisible(true)}
                          onBlur={() => setTimeout(() => setDriverSuggestionsVisible(false), 150)}
                        />
                        {driverSuggestionsVisible && driverQuery && (
                          <div className="absolute z-20 bg-white border rounded w-full mt-1 max-h-40 overflow-auto shadow">
                            {drivers.filter((drv) => drv.name.toLowerCase().includes(driverQuery.toLowerCase())).map((drv) => (
                              <div key={drv.id} className="p-2 hover:bg-slate-50 cursor-pointer text-sm"
                                onMouseDown={() => {
                                  setEditValues((s) => ({ ...s, driverId: drv.id }));
                                  setDriverQuery(`${drv.name} – ${drv.phone}`);
                                  setDriverSuggestionsVisible(false);
                                }}>
                                {drv.name} – {drv.phone}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
                      <Select value={editValues?.status || d.status} onValueChange={(v) => setEditValues((s) => ({ ...s, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Date</label>
                      <Input type="date" value={editValues?.deliveryDate || ""} onChange={(e) => setEditValues((s) => ({ ...s, deliveryDate: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Time</label>
                      <Input type="time" value={editValues?.deliveryTime || ""} onChange={(e) => setEditValues((s) => ({ ...s, deliveryTime: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Delivery Fee</label>
                      <Input type="number" min="0" step="1" value={editValues?.deliveryFee || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!/^\d*$/.test(value)) return;
                          setEditValues((s) => ({ ...s, deliveryFee: value ? parseInt(value, 10) : 0 }));
                        }} placeholder="Fee" /></div>
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
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">#{d.id} · {d.customer?.name || "—"}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    {d.deliveryAddress && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{d.deliveryAddress}</p>}
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{d.driver?.name || "No driver"}</span>
                      <span>{formatDateTime(d.deliveryDate)}</span>
                    </div>
                    {d.deliveryFee != null && <p className="text-sm text-gray-600 mt-1">Fee: AFN {d.deliveryFee}</p>}
                    <div className="flex gap-1.5 mt-3">
                      <Button size="sm" variant="ghost" onClick={() => setLastPrintedDelivery({ ...d })}>
                        <Printer className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(d)}>
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="ghost" disabled={user?.role !== "ADMIN"} onClick={() => deleteDelivery(d.id)}>
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

      {/* Hidden delivery print area */}
      <div className="hidden">
        {lastPrintedDelivery && (
          <Delivery
            ref={deliveryRef}
            customer={lastPrintedDelivery.customer || "—"}
            address={lastPrintedDelivery.deliveryAddress || "—"}
            deliveryDate={lastPrintedDelivery.deliveryDate || "—"}
            deliveryFee={lastPrintedDelivery.deliveryFee || "—"}
            saleId={lastPrintedDelivery.saleId ?? lastPrintedDelivery.id}
            phone={lastPrintedDelivery.customerPhone || "—"}
            driver={lastPrintedDelivery.driver || "—"}
          />
        )}
      </div>
    </div>
  );
}
