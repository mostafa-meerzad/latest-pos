"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Search } from "lucide-react";
import PaginationBar from "@/components/PaginationBar";
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

        const res = await fetch(`/api/sale?${params.toString()}`);
        const data = await res.json();

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, paymentFilter, fromDate, toDate]);

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
            <Button>
              New Sale
            </Button>
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
        <Select
          value={paymentFilter}
          onValueChange={(v) => setPaymentFilter(v)}
        >
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
            className="pr-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* Table */}
      <Card className={loading ? "p-0" : ""}>
        <CardContent className={loading ? "p-0" : ""}>
          {loading ? (
            <Card className="p-4 rounded-2xl border-none shadow-sm border">
              <table className="min-w-full text-lg overflow-x-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Sale ID</th>
                    <th className="text-left py-2 px-3 font-medium">
                      Customer
                    </th>
                    <th className="text-left py-2 px-3 font-medium">Total</th>
                    <th className="text-left py-2 px-3 font-medium">Date</th>
                    <th className="text-left py-2 px-3 font-medium">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 font-medium">Action</th>
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
                        <Link
                          href={`/sales/add-sale?edit=true&id=${order.rawId}`}
                        >
                          <Button
                            size="sm"
                            variant="default"
                            className="ml-3"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-14 text-center">
                      <p className="text-gray-500 mb-3">No sales found.</p>
                      <Link href="/sales/add-sale">
                        <Button>New Sale</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
