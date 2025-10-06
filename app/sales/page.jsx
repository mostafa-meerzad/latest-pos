"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
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

export default function SalesPage() {
  // ----------------------------
  // 🔹 Local State
  // ----------------------------
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setpaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  // ----------------------------
  // 🔹 Fetch sales from API
  // ----------------------------
  useEffect(() => {
    async function fetchSales() {
      try {
        setLoading(true);
        const res = await fetch("/api/sale");
        const data = await res.json();
        if (res.ok && data.success) {
          // normalize sales data for easier use
          const formatted = data.data.map((s) => ({
            id: `#${s.id}`, // or `#2025-${s.id}`
            customer: s.customer?.name || "Walk-in",
            total: `AFN ${s.totalAmount}`,
            date: s.date,
            payment_method: s.paymentMethod,
            rawId: s.id, // keep original ID for details route
          }));
          setSalesData(formatted);
        } else {
          console.error("Failed to fetch sales:", data.error || data);
        }
      } catch (err) {
        console.error("Error fetching sales:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  // ----------------------------
  // 🔹 Filtering Logic
  // ----------------------------
  const filteredData = useMemo(() => {
    return salesData.filter((item) => {
      const matchesPayment =
        paymentFilter === "all" || item.payment_method === paymentFilter;

      const matchesSearch =
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchQuery.toLowerCase());

      const itemDate = new Date(item.date);

      const matchesFromDate = fromDate ? itemDate >= new Date(fromDate) : true;
      const matchesToDate = toDate
        ? itemDate <= new Date(toDate + "T23:59:59")
        : true;

      return matchesPayment && matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [salesData, paymentFilter, searchQuery, fromDate, toDate]);

  // ----------------------------
  // 🔹 Pagination Logic
  // ----------------------------
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  useMemo(() => {
    setCurrentPage(1);
  }, [paymentFilter, searchQuery, fromDate, toDate]);

  // ----------------------------
  // 🔹 Handlers
  // ----------------------------
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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
          <Button className={"bg-green-500 text-md"}>New Sale</Button>
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

        {/* payment Filter */}
        <Select onValueChange={(v) => setpaymentFilter(v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="payment" />
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
            value={searchQuery ?? ""}
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((order) => (
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
                    No results found.
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
                className={page === currentPage ? "bg-orange-500 text-white" : ""}
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
