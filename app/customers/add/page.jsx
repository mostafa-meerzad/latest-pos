"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

    if (!name.trim()) return setError("Customer name is required.");

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
        router.push("/customers");
      } else {
        const msg =
          data?.error?.message ||
          data?.error ||
          JSON.stringify(data?.error || data) ||
          "Failed to create customer";
        setError(msg);
      }
    } catch (err) {
      console.error("Error creating customer:", err);
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Add Customer</h1>
        <Link href="/customers">
          <Button variant="outline" className={"drop-shadow-2xl"}>Back to Customers</Button>
        </Link>
      </div>
      <div className="flex justify-center">
      <form onSubmit={handleSubmit} className="min-w-3xl drop-shadow-2xl">
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
                <label className="text-sm font-medium block mb-1">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1">Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address"
                />
              </div>
            </div>

            {/* form actions */}
            <div className="mt-6 flex items-center gap-3">
              <Button type="submit" className="bg-orange-500" disabled={submitting}>
                {submitting ? "Saving..." : "Create Customer"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/customers")}>
                Cancel
              </Button>

              {error && <div className="ml-4 text-sm text-red-600">{String(error)}</div>}
            </div>
          </CardContent>
        </Card>
      </form>
      </div>
    </div>
  );
}
