"use client";

import React, { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import useSaleStore from "@/components/saleStore";

export default function PurchaseDetailPage() {
  const router = useRouter();
  const items = useSaleStore((s) => s.items);

  // Auto-redirect if cart gets cleared after sale finalization
  useEffect(() => {
    if (items.length === 0) {
      const t = setTimeout(() => {
        router.push("/customer-screen");
      }, 1500); // small delay for smooth UX
      return () => clearTimeout(t);
    }
  }, [items, router]);

  const normalized = useMemo(() => {
    return items.map((it) => {
      const price = Number(it.unitPrice || it.price || 0);
      const qty = Number(it.quantity || 0);
      const discount = Number(it.discount || 0);
      const subtotal =
        typeof it.subtotal === "number"
          ? it.subtotal
          : +(price * qty - discount);
      return { ...it, price, qty, discount, subtotal: +subtotal.toFixed(2) };
    });
  }, [items]);

  const totalItems = normalized.reduce((s, it) => s + it.qty, 0);
  const subtotal = normalized.reduce((s, it) => s + it.price * it.qty, 0);
  const discount = normalized.reduce((s, it) => s + (it.discount || 0), 0);
  const total = +(subtotal - discount).toFixed(2);
  console.log(items);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold text-orange-600 mb-6">
          Purchase Details
        </h1>
        <Link href="/customer-screen">
          <Button variant="outline">Purchase Completed</Button>
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow className={"text-xl"}>
            <TableHead className={"font-bold"}>Product</TableHead>
            <TableHead className={"font-bold"}>Quantity</TableHead>
            <TableHead className={"font-bold"}>Price</TableHead>
            <TableHead className={"font-bold"}>Subtotal</TableHead>
            <TableHead className={"font-bold"}>Expire Date</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {normalized.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500">
                Waiting for items...
              </TableCell>
            </TableRow>
          ) : (
            normalized.map((item, i) => (
              <TableRow key={item.tempId ?? item.id ?? i} className={"text-lg"}>
                <TableCell>{item.name ?? item.product ?? "Unknown"}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>AFN {item.price.toFixed(2)}</TableCell>
                <TableCell>AFN {item.subtotal.toFixed(2)}</TableCell>
                <TableCell>{item.expiryDate ?? "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="mt-8 flex flex-col items-end space-y-2 text-lg font-medium text-orange-600">
        <p>Items: {totalItems}</p>
        <p>Subtotal: AFN {subtotal.toFixed(2)}</p>
        <p>Discount: AFN {discount.toFixed(2)}</p>
        <p className="text-xl font-bold">Total: AFN {total.toFixed(2)}</p>
      </div>
    </div>
  );
}
