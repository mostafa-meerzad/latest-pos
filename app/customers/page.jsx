"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";
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
import CustomerImg from "@/assets/customer_img.png";
import PaginationBar from "@/components/PaginationBar";
import { Skeleton } from "@/components/ui/skeleton";

const LIMIT = 25;

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: LIMIT.toString(),
        search: debouncedSearch,
      });
      const res = await fetch(`/api/customer?${params}`);
      const data = await res.json();
      if (data?.success) {
        setCustomers(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={CustomerImg} width={70} height={70} alt="customers page logo" />
          Customers
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/customers/add">
            <Button className="bg-orange-500 hover:bg-orange-600 text-md">Add Customer</Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* Search */}
      <div className="relative w-[300px]">
        <Input
          placeholder="Search customers..."
          className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      </div>

      {/* Table */}
      {isLoading ? (
        <CustomersSkeleton />
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-lg">
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length > 0 ? (
                  customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name || "Walk in"}</TableCell>
                      <TableCell>{c.phone || "-"}</TableCell>
                      <TableCell>{c.email || "-"}</TableCell>
                      <TableCell>
                        <Button
                          className="hover:bg-gray-300 hover:text-gray-700"
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/customers/${c.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-10">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}

function CustomersSkeleton() {
  return (
    <div className="border rounded-lg p-6 py-10 flex items-center justify-between">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-full px-2 flex flex-col gap-6">
          <Skeleton className="w-40 h-8 mb-4" />
          <Skeleton className="w-30 h-6" />
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-40 h-6" />
          <Skeleton className="w-30 h-6" />
          <Skeleton className="w-40 h-6" />
        </div>
      ))}
    </div>
  );
}
