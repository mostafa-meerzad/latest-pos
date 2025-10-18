"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Customers
  useEffect(() => {
    async function fetchCustomers() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/customer");
        const data = await res.json();
        if (data?.success) {
          setCustomers(data.data || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
      }
    }
    fetchCustomers();
  }, []);

  // Filtering and sorting
  const filteredData = useMemo(() => {
    let result = [...customers];
    if (searchQuery) {
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sorting in descending order (newest first)
    // Assuming customers have an 'id' or 'createdAt' field for sorting
    result.sort((a, b) => {
      // Use createdAt if available, otherwise use id
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // Fallback to ID if no createdAt
      return b.id - a.id;
    });

    return result;
  }, [customers, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ----------------- Header ----------------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image
            src={CustomerImg}
            width={70}
            height={70}
            alt="customers page logo"
          />
          Customers
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/customers/add">
            <Button className="bg-orange-500 hover:bg-orange-600 text-md">
              Add Customer
            </Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* ----------------- Search ----------------- */}
      <div className="relative w-[300px]">
        <Input
          placeholder="Search customers..."
          className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      </div>

      {/* ----------------- Table ----------------- */}

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
                {paginatedData.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name || "Walk in"}</TableCell>
                    <TableCell>{c.phone || "-"}</TableCell>
                    <TableCell>{c.email || "-"}</TableCell>
                    <TableCell>
                      <Button
                        className={"hover:bg-gray-300 hover:text-gray-700"}
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/customers/${c.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ----------------- Pagination ----------------- */}
      {totalPages > 1 && (
        <div className="flex gap-2 items-center">
          {/* Prev Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </Button>

          {/* Page Numbers */}
          {[...Array(3)].map((_, i) => {
            let pageNumber;
            if (currentPage === 1) {
              pageNumber = i + 1;
            } else if (currentPage === totalPages) {
              pageNumber = totalPages - 2 + i;
            } else {
              pageNumber = currentPage - 1 + i;
            }

            if (pageNumber < 1 || pageNumber > totalPages) return null;

            return (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                className={
                  pageNumber === currentPage ? "bg-orange-500 text-white" : ""
                }
                size="sm"
                onClick={() => goToPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function CustomersSkeleton() {
  return (
    <div className=" border rounded-lg p-6 py-10 flex items-center justify-between">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-full px-2 flex flex-col gap-6">
          <Skeleton key={i} className={"w-40 h-8 mb-4"} />

          <Skeleton className={"w-30 h-6"} />
          <Skeleton className={"w-48 h-6"} />
          <Skeleton className={"w-40 h-6"} />
          <Skeleton className={"w-30 h-6"} />
          <Skeleton className={"w-40 h-6"} />
        </div>
      ))}
    </div>
  );
}
