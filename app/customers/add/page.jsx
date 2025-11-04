"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function AddCustomerPage() {
  const router = useRouter();

  // form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // ui state
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (name?.trim().length < 2) {
      const msg = "Customer name should be at least 2 character.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (address?.trim().length == 0) {
      setAddress(undefined);
    } else if (address.trim().length < 5) {
      const msg = "Address should be at least 10 character.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (phone?.trim().length > 0)
      if (!parseInt(phone)) {
        const msg = "Invalid phone number.";
        setError(msg);
        toast.error(msg);
        return;
      }

    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      };

      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Customer added successfully!");
        router.push("/customers");
      } else {
        const msg =
          data?.error?.message ||
          data?.error ||
          JSON.stringify(data?.error || data) ||
          "Failed to create customer";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error("Error creating customer:", err);
      const msg = err.message || "Network error";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-20">
        <h1 className="text-3xl font-bold">Add Customer</h1>
        <Link href="/customers">
          <Button variant="outline">Back to Customers</Button>
        </Link>
      </div>
      <div className="flex justify-center drop-shadow-2xl">
        <form onSubmit={handleSubmit} className="min-w-3xl">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Customer Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Phone
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium block mb-1">
                    Address
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              {/* form actions */}
              <div className="mt-6 flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-400"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Create Customer"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/customers")}
                >
                  Cancel
                </Button>

                {error && (
                  <div className="ml-4 text-sm text-red-600">
                    {String(error)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
