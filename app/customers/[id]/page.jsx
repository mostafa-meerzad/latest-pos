"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash2, ArrowLeft } from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Fetch customer data
  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customer/${id}/history`);
        const data = await res.json();
        if (data?.success) {
          setCustomer(data.data);
          setFormData({
            name: data.data.name || "",
            phone: data.data.phone || "",
            email: data.data.email || "",
            address: data.data.address || "",
          });
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCustomer();
  }, [id]);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Update customer
  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/customer/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev) => ({ ...prev, ...formData }));
        setEditMode(false);
      } else {
        alert("Update failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete customer (set inactive)
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await fetch(`/api/customer/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/customers");
      } else {
        alert("Delete failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-red-500">Customer not found.</p>
        <Button variant="outline" onClick={() => router.push("/customers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <div className="flex justify-end">
      <Button
        variant="outline"
        onClick={() => router.push("/customers")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
        </div>
      {/* Two-Column Layout */}
      <div className="flex gap-6 items-start">
        {/* Left: Customer Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Customer Details</h2>

            {editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Name"
                />
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                />
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Address"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <p>
                  <strong>Name:</strong> {customer.name}
                </p>
                <p>
                  <strong>Phone:</strong> {customer.phone}
                </p>
                <p>
                  <strong>Email:</strong> {customer.email}
                </p>
                <p>
                  <strong>Address:</strong> {customer.address}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`${
                      customer.status === "ACTIVE"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {customer.status}
                  </span>
                </p>
                <p>
                  <strong>Joined:</strong>{" "}
                  {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button onClick={handleUpdate}>Save</Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    <Pencil className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Purchase History */}
        <Card className={"min-w-2/3"}>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
            {customer.sales && customer.sales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.sales.map((sale) => (
                    <TableRow key={sale.id}>
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
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500">No purchase history available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
