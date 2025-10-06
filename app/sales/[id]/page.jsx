"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export default function SaleDetailsPage() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchSale = async () => {
      try {
        const res = await fetch(`/api/sale/${id}`);
        const json = await res.json();
        if (json.success) {
          setSale(json.data);
        }
      } catch (err) {
        console.error("Error fetching sale:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!sale) return <p className="p-6">Sale not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sale #{sale.id}</h1>

      <Card className="min-w-2/3">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sale Details</h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Delivery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  {new Date(sale.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{sale.invoice?.invoiceNumber || "-"}</TableCell>
                <TableCell>
                  ${sale.totalAmount}{" "}
                  <span className="text-xs text-gray-500">
                    (Tax {sale.taxAmount}, Disc {sale.discountAmount})
                  </span>
                </TableCell>
                <TableCell>{sale.paymentMethod}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{sale.customer?.name}</p>
                    {sale.customer?.phone && (
                      <p className="text-xs text-gray-500">
                        {sale.customer.phone}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {sale.items.map((i) => (
                    <div key={i.id} className="text-sm">
                      {i.product?.name} × {i.quantity} = ${i.subtotal}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  {sale.delivery ? (
                    <div className="text-sm">
                      <p>{sale.delivery.deliveryAddress}</p>
                      <p className="text-gray-500">
                        Driver: {sale.delivery.driver?.name}
                      </p>
                      <p>Status: {sale.delivery.status}</p>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
