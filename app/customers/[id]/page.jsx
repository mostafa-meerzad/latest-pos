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
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

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
        } else {
          toast.error("Failed to fetch customer data.");
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
        toast.error("An error occurred while fetching customer data.");
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
    toast.promise(
      (async () => {
        const res = await fetch(`/api/customer/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Unknown error");
        }
        setCustomer((prev) => ({ ...prev, ...formData }));
        setEditMode(false);
      })(),
      {
        loading: "Updating customer...",
        success: "Customer updated successfully!",
        error: (err) => `Update failed: ${err.message}`,
      }
    );
  };

  // Delete customer (set inactive)
  // Delete customer (set inactive)
  const handleDelete = async () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Are you sure you want to delete this customer?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              variant="destructive"
              onClick={async () => {
                toast.dismiss(t.id);
                toast.promise(
                  (async () => {
                    const res = await fetch(`/api/customer/${id}`, {
                      method: "DELETE",
                    });
                    const data = await res.json();
                    if (!data.success)
                      throw new Error(data.error || "Unknown error");
                    router.push("/customers");
                  })(),
                  {
                    loading: "Deleting customer...",
                    success: "Customer deleted successfully!",
                    error: (err) => `Delete failed: ${err.message}`,
                  }
                );
              }}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
      }
    );
  };

  // if (!customer) {
  //   return <CustomerSkeleton />;
  // }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Customer Details</h2>

        <Button
          variant="outline"
          onClick={() => router.push("/customers")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      {loading ? (
        <CustomerDetailsSkeleton />
      ) : (
        <div className="flex gap-6 items-start">
          {/* Left: Customer Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
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
                <div className="grid grid-cols-1  gap-3">
                  <p>
                    <strong>Name:</strong>{" "}
                    <span className="text-[1rem] text-gray-700 font-semibold">
                      {customer.name}
                    </span>
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    <span className="text-[1rem] text-gray-700 font-semibold">
                      {customer.phone}
                    </span>
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    <span className="text-[1rem] text-gray-700 font-semibold">
                      {customer.email}
                    </span>
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    <span className="text-[1rem] text-gray-700 font-semibold">
                      {customer.address}
                    </span>
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
                      <span className="text-[1rem] text-gray-700 font-semibold">
                        {formData.name !== "WALK-IN CUSTOMER" &&
                          customer.status}
                      </span>
                    </span>
                  </p>
                  <p>
                    <strong>Joined:</strong>{" "}
                    <span className="text-[1rem] text-gray-700 font-semibold">
                      {formData.name !== "WALK-IN CUSTOMER" &&
                        new Date(customer.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              )}

              <div
                className={`${
                  formData.name === "WALK-IN CUSTOMER" &&
                  "pointer-events-none opacity-30 select-none"
                } flex gap-2`}
              >
                {editMode ? (
                  <>
                    <Button
                      onClick={handleUpdate}
                      className={
                        "bg-green-400 hover:bg-green-300 hover:text-green-800"
                      }
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      className={"hover:bg-gray-300 hover:text-gray-700"}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(true)}
                      className={"hover:bg-gray-300 hover:text-gray-700"}
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className={
                        "bg-red-500 text-white hover:bg-red-300 hover:text-red-800"
                      }
                    >
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
                        <TableCell
                          className={"text-[1rem] font-semibold text-gray-700"}
                        >
                          {new Date(sale.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {sale.invoice?.invoiceNumber || "-"}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-gray-600">
                            AFG
                          </span>{" "}
                          <span className="font-bold">{sale.totalAmount}</span>{" "}
                          <span className="text-sm text-gray-500">
                            ( Tax{" "}
                            <span className="text-sm font-semibold text-gray-700">
                              {sale.taxAmount}
                            </span>
                            , Disc{" "}
                            <span className="text-sm font-semibold text-gray-700">
                              {sale.discountAmount}
                            </span>{" "}
                            {/*  */})
                          </span>
                        </TableCell>
                        <TableCell className={"font-medium text-gray-700"}>
                          {sale.paymentMethod}
                        </TableCell>
                        <TableCell>
                          {sale.items.map((i) => (
                            <div key={i.id} className="text-sm">
                              <span className="text-sm text-gray-900 font-semibold">
                                {i.product?.name}
                              </span>{" "}
                              ×{" "}
                              <span className="text-sm text-gray-900 font-semibold">
                                {i.quantity}
                              </span>{" "}
                              ={" "}
                              <span className="font-semibold text-gray-600">
                                AFG
                              </span>{" "}
                              <span className="font-bold">{i.subtotal}</span>
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          {sale.delivery ? (
                            <div className="text-sm">
                              <p>{sale.delivery.deliveryAddress}</p>
                              <p className="text-gray-500">
                                <span className="text-sm font-semibold text-gray-700">
                                  Driver:
                                </span>{" "}
                                <span className="text-[1rem] font-semibold text-gray-900">
                                  {sale.delivery.driver?.name}
                                </span>
                              </p>
                              <p>
                                <span className="text-sm font-semibold text-gray-700">
                                  Status:
                                </span>{" "}
                                <span className="text-[1rem] font-semibold text-gray-900">
                                  {sale.delivery.status}
                                </span>
                              </p>
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
      )}
    </div>
  );
}

function CustomerDetailsSkeleton() {
  return (
    <div className="flex gap-6 p-6">
      {/* Left Panel: Customer Details */}
      <div className="space-y-4 border rounded-lg p-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-56" /> {/* Name */}
          <Skeleton className="h-5 w-40" /> {/* Phone */}
          <Skeleton className="h-5 w-64" /> {/* Email */}
          <Skeleton className="h-5 w-72" /> {/* Address */}
          <Skeleton className="h-5 w-24" /> {/* Status */}
          <Skeleton className="h-5 w-32" /> {/* Joined */}
        </div>
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-10 w-24 rounded-md" /> {/* Edit */}
          <Skeleton className="h-10 w-24 rounded-md" /> {/* Delete */}
        </div>
      </div>

      {/* Right Panel: Purchase History */}
      <div className="space-y-6 py-8 flex flex-col justify-start border rounded-lg p-6 w-full overflow-x-hidden">
        <Skeleton className="h-6 w-40" /> {/* Payment */}
        <div className="flex ">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className=" p-4 space-y-3">
              <Skeleton className="h-4 w-18" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" /> {/* Status */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
