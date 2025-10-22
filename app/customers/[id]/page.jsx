"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  User,
  Home,
  Phone,
  Mail,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
          // toast.success("Customer details loaded successfully");
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
        if (!data.success) throw new Error(data.error || "Unknown error");
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
      { duration: Infinity }
    );
  };

  if (loading) return <CustomerDetailsSkeleton />;

  if (!customer)
    return (
      <div className="p-6 text-center text-gray-500">No customer found.</div>
    );

  return (
    <motion.div
      className="p-6 max-w-4xl mx-auto mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="rounded-2xl border border-gray-100 drop-shadow-2xl">
        <CardContent className="p-8 space-y-6">
          {/* ===== Header ===== */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                {formData.name}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    customer.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {customer.status}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">ID: #{customer.id}</p>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                onClick={() => router.push("/customers")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </motion.div>
          </div>

          {/* ===== Customer Info ===== */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" /> Customer Information
            </h2>

            {editMode ? (
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
                <Detail
                  icon={<User className="w-4 h-4 text-gray-500" />}
                  label="Name"
                  value={customer.name}
                />
                <Detail
                  icon={<Phone className="w-4 h-4 text-gray-500" />}
                  label="Phone"
                  value={customer.phone}
                />
                <Detail
                  icon={<Mail className="w-4 h-4 text-gray-500" />}
                  label="Email"
                  value={customer.email}
                />
                <Detail
                  icon={<Home className="w-4 h-4 text-gray-500" />}
                  label="Address"
                  value={customer.address}
                />
                {formData.name.toLowerCase().startsWith("walk-in") && (
                  <Detail
                    label="Joined"
                    value={new Date(customer.createdAt).toLocaleDateString()}
                  />
                )}
              </div>
            )}

            <div
              className={`${
                formData.name.toLocaleLowerCase().startsWith("walk-in")
                  ? "pointer-events-none opacity-30 select-none"
                  : ""
              } flex gap-2 pt-2`}
            >
              {editMode ? (
                <>
                  <Button
                    onClick={handleUpdate}
                    className="bg-green-500 text-white hover:bg-green-400"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    className="hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(true)}
                    className="hover:bg-gray-100"
                  >
                    <Pencil className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-400 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          {/* ===== Purchase History ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-500" /> Purchase History
            </h2>

            {customer.sales?.length > 0 ? (
              <div className="space-y-4">
                {customer.sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100"
                  >
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{new Date(sale.date).toLocaleDateString()}</span>
                      {/* <span>Invoice: {sale.invoice?.invoiceNumber ?? "—"}</span> */}
                    </div>

                    <p className="font-semibold text-gray-800">
                      Total: AFG {sale.totalAmount}{" "}
                      <span className="text-sm text-gray-500">
                        (Tax {sale.taxAmount}, Disc {sale.discountAmount})
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Payment Method:{" "}
                      <span className="font-medium text-gray-800">
                        {sale.paymentMethod}
                      </span>
                    </p>

                    <div className="border-t border-gray-200 pt-2 space-y-1">
                      <p className="font-medium text-gray-700 flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-500" /> Items:
                      </p>
                      {sale.items.map((i) => (
                        <div
                          key={i.id}
                          className="text-sm text-gray-800 flex justify-between pl-6"
                        >
                          <span>
                            {i.product?.name} × {i.quantity}
                          </span>
                          <span>AFG {i.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    {sale.delivery && (
                      <div className="border-t border-gray-200 pt-2 space-y-1">
                        <p className="font-medium text-gray-700 flex items-center gap-1">
                          <Truck className="w-4 h-4 text-gray-500" /> Delivery:
                        </p>
                        <p className="text-sm text-gray-600 pl-6">
                          Address:{" "}
                          <span className="font-medium text-gray-800">
                            {sale.delivery.deliveryAddress}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 pl-6">
                          Driver:{" "}
                          <span className="font-medium text-gray-800">
                            {sale.delivery.driver?.name}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 pl-6">
                          Status:{" "}
                          <span className="font-medium text-gray-800">
                            {sale.delivery.status}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No purchase history available.
              </p>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* Small reusable info row */
function Detail({ label, value, icon }) {
  return (
    <div className="flex items-center gap-2 text-gray-700">
      {icon}
      <div className="text-sm text-gray-500">{label}:</div>
      <div className="font-medium text-[1rem]">{value || "—"}</div>
    </div>
  );
}

/* ===== Skeleton Loader ===== */
function CustomerDetailsSkeleton() {
  return (
    <motion.div
      className="p-6 max-w-4xl mx-auto mt-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="rounded-2xl border border-gray-100 drop-shadow-2xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <Skeleton className="h-8 w-48 rounded-md" />
              <Skeleton className="h-4 w-64 mt-2 rounded-md" />
            </div>
            <Button variant="outline" disabled>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" /> Customer Information
          </h2>

          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2 rounded-md" />
                <Skeleton className="h-5 w-32 rounded-md" />
              </div>
            ))}
          </div>

          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-400" /> Purchase History
          </h2>

          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl p-4 space-y-3 border border-gray-200"
              >
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-4 w-64 rounded-md" />
                <Skeleton className="h-4 w-56 rounded-md" />
                <Skeleton className="h-4 w-60 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
