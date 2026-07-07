"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
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
          <Image src={CustomerImg} width={60} height={60} alt="customers" />
          Customers
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/customers/add"><Button>Add Customer</Button></Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search customers..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-28 mb-1.5" />
                      <Skeleton className="h-3 w-44" />
                    </td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-24 rounded-md" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-gray-500">
                    <p className="mb-3">No customers found.</p>
                    <Link href="/customers/add"><Button size="sm">Add Customer</Button></Link>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-900">{c.name || "Walk-in"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700">{c.phone || <span className="text-gray-300">—</span>}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.email || <span className="text-gray-300">—</span>}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/customers/${c.id}`)}>
                        <Eye className="w-4 h-4 text-gray-600 mr-1" /> View
                      </Button>
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
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-36" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </Card>
          ))
        ) : customers.length === 0 ? (
          <Card>
            <div className="py-14 text-center">
              <p className="text-gray-500 mb-3">No customers found.</p>
              <Link href="/customers/add"><Button>Add Customer</Button></Link>
            </div>
          </Card>
        ) : (
          customers.map((c) => (
            <Card key={c.id}>
              <div className="p-4">
                <p className="font-semibold text-gray-900">{c.name || "Walk-in"}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>{c.phone || "—"}</span>
                  <span>{c.email || "—"}</span>
                </div>
                <div className="mt-3">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/customers/${c.id}`)}>
                    <Eye className="w-4 h-4 text-gray-600 mr-1" /> View
                  </Button>
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
