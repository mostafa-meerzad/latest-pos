"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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

export default function SalesPage() {
  // ----------------------------
  // 🔹 Local State
  // ----------------------------
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const itemsPerPage = 6;

  // ----------------------------
  // 🔹 Fetch sales from API (with all filters)
  // ----------------------------
  useEffect(() => {
    async function fetchSales() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          payment: paymentFilter,
          fromDate: fromDate,
          toDate: toDate,
        });

        // console.log("Fetching sales with params:", params.toString()); // Debug log

        const res = await fetch(`/api/sale?${params.toString()}`);
        const data = await res.json();

        // console.log("API Response:", data); // Debug log

        if (res.ok && data.success) {
          const formatted = data.data.map((s) => ({
            id: `#${s.id}`,
            customer: s.customer?.name || "Walk-in",
            total: `AFN ${s.totalAmount}`,
            date: s.date,
            payment_method: s.paymentMethod,
            rawId: s.id,
          }));

          setSalesData(formatted);
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.total);
        } else {
          console.error("Failed to fetch sales:", data.error || data);
          setSalesData([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } catch (err) {
        console.error("Error fetching sales:", err);
        setSalesData([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchSales();
  }, [currentPage, searchQuery, paymentFilter, fromDate, toDate]);

  // ----------------------------
  // 🔹 Reset to page 1 when filters change
  // ----------------------------
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter, fromDate, toDate]);

  // ----------------------------
  // 🔹 Handlers
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
        <Button
          key={1}
          variant="outline"
          size="sm"
          onClick={() => goToPage(1)}
        >
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

  return (
    <div className="p-6 space-y-6">
      {/* ----------------- Header ----------------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image
            src={salesImage}
            width={100}
            height={100}
            alt="sales image"
            priority
          />
          Sales History
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/sales/add-sale">
            <Button className={"bg-green-500 text-md hover:bg-green-400 "}>New Sale</Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* ----------------- Filters ----------------- */}
      <div className="flex flex-wrap items-center gap-4">
        {/* From / To Date Filters */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-[160px]"
          />
          <span>to</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-[160px]"
          />
        </div>

        {/* Payment Filter */}
        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Cash">By Cash</SelectItem>
            <SelectItem value="Card">By Card</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative w-[250px]">
          <Input
            placeholder="Search by Sale ID or Customer"
            className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* ----------------- Info Text ----------------- */}
      {/* {!loading && (
        <div className="text-sm text-gray-600">
          Showing {salesData.length} of {totalCount} sales
          {(searchQuery || paymentFilter !== "all" || fromDate || toDate) && 
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
                    <th className="text-left py-2 px-3 font-medium">Sale ID</th>
                    <th className="text-left py-2 px-3 font-medium">Customer</th>
                    <th className="text-left py-2 px-3 font-medium">Total</th>
                    <th className="text-left py-2 px-3 font-medium">Date</th>
                    <th className="text-left py-2 px-3 font-medium">Payment Method</th>
                    <th className="text-left py-2 px-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-10" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="py-3 px-3">
                        <Skeleton className="h-4 w-40" />
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
                <TableRow className={"text-lg"}>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.length > 0 ? (
                  salesData.map((order) => (
                    <TableRow key={order.rawId}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.total}</TableCell>
                      <TableCell>
                        {new Date(order.date).toLocaleString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{order.payment_method}</TableCell>
                      <TableCell>
                        <Link href={`/sales/${order.rawId}`}>
                          <Button variant="secondary" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No sales found.
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