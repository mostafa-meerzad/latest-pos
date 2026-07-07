"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Search } from "lucide-react";
import PaginationBar from "@/components/PaginationBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import salesImage from "@/assets/sales_img.png";
import BackToDashboardButton from "@/components/BackToDashboardButton";
import { Skeleton } from "@/components/ui/skeleton";

const PAYMENT_BADGE = {
  Cash: "bg-green-100 text-green-700",
  Card: "bg-blue-100 text-blue-700",
  Mobile: "bg-purple-100 text-purple-700",
  Other: "bg-gray-100 text-gray-600",
};

export default function SalesPage() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 25;

  useEffect(() => {
    async function fetchSales() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          payment: paymentFilter,
          fromDate,
          toDate,
        });
        const res = await fetch(`/api/sale?${params}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setSalesData(data.data);
          setTotalPages(data.pagination.totalPages);
        } else {
          setSalesData([]);
          setTotalPages(1);
        }
      } catch {
        setSalesData([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, [currentPage, searchQuery, paymentFilter, fromDate, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter, fromDate, toDate]);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={salesImage} width={60} height={60} alt="sales" priority />
          Sales History
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/sales/add-sale">
            <Button>New Sale</Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-[150px]"
          />
          <span className="text-gray-400 text-sm">to</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-[150px]"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Card">Card</SelectItem>
            <SelectItem value="Mobile">Mobile</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by sale ID or customer"
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
                <th className="px-5 py-3 text-left">Sale</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-12 mb-1.5" />
                      <Skeleton className="h-3 w-32" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-20 mb-1.5" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-5 py-4 flex gap-2">
                      <Skeleton className="h-8 w-24 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : salesData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-500">
                    <p className="mb-3">No sales found.</p>
                    <Link href="/sales/add-sale"><Button size="sm">New Sale</Button></Link>
                  </td>
                </tr>
              ) : (
                salesData.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">#{s.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.customer?.name || "Walk-in"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">AFN {s.totalAmount}</p>
                      <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_BADGE[s.paymentMethod] || PAYMENT_BADGE.Other}`}>
                        {s.paymentMethod || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(s.date)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/sales/${s.id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-600">View</Button>
                        </Link>
                        <Link href={`/sales/add-sale?edit=true&id=${s.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-4 h-4 text-gray-600" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
                <div className="flex justify-between mt-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </Card>
          ))
        ) : salesData.length === 0 ? (
          <Card>
            <div className="py-14 text-center">
              <p className="text-gray-500 mb-3">No sales found.</p>
              <Link href="/sales/add-sale"><Button>New Sale</Button></Link>
            </div>
          </Card>
        ) : (
          salesData.map((s) => (
            <Card key={s.id}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">#{s.id}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_BADGE[s.paymentMethod] || PAYMENT_BADGE.Other}`}>
                    {s.paymentMethod || "—"}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{s.customer?.name || "Walk-in"}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-gray-900">AFN {s.totalAmount}</span>
                  <span className="text-xs text-gray-400">{formatDate(s.date)}</span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <Link href={`/sales/${s.id}`}>
                    <Button variant="ghost" size="sm" className="text-gray-600">View</Button>
                  </Link>
                  <Link href={`/sales/add-sale?edit=true&id=${s.id}`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="w-4 h-4 text-gray-600" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
