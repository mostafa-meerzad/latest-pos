"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateSupplierPage() {
  const router = useRouter();

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");

  // ui state
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // helper: normalize error into human-readable string
  function extractErrorMessage(error) {
    if (!error) return "Unknown error occurred";

    // If backend sent a flattened Zod error
    if (typeof error === "object") {
      if (error.fieldErrors) {
        return Object.entries(error.fieldErrors)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ");
      }
      if (error.message) return error.message;
      if (Array.isArray(error)) return error.join(", ");
      return JSON.stringify(error);
    }

    return String(error);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // simple client validation
    // if (!name.trim()) return setError("Supplier name is required.");
    // if (!phone.trim()) return setError("Phone number is required.");

    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim(),
      };

      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/suppliers");
      } else {
        // const msg = extractErrorMessage(data.error);
        setError(data.error && "Failed to create supplier");
        // console.log(data.error)
        setFieldErrors(data.error?.fieldErrors || {});
      }
    } catch (err) {
      console.error("Error creating supplier:", err);
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Add Supplier</h1>
        <Link href="/suppliers">
          <Button variant="outline" className="drop-shadow-2xl">
            Back to Suppliers
          </Button>
        </Link>
      </div>

      <div className="flex justify-center">
        <form onSubmit={handleSubmit} className="min-w-4xl drop-shadow-2xl">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Supplier Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={fieldErrors.name || "Enter supplier name"}
                    className={`${fieldErrors.name && "border-red-400 "}`}
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
                    placeholder={fieldErrors.email || "Enter supplier email"}
                    className={`${
                      fieldErrors.email && "border-red-400 "
                    } invalid:focus:ring-red-400 invalid:focus:ring-1 invalid:focus:border-none`}
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
                    placeholder={
                      fieldErrors.address || "Enter supplier address"
                    }
                    className={`${fieldErrors.address && "border-red-400 "}`}
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Contact Person
                  </label>
                  <Input
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder={
                      fieldErrors.contactPerson || "Enter contact person name"
                    }
                    className={`${
                      fieldErrors.contactPerson && "border-red-400 "
                    }`}
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
                    placeholder={fieldErrors.phone || "Enter phone number"}
                    className={`${fieldErrors.phone && "border-red-400 "}`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-orange-500"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Create Supplier"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/suppliers")}
                >
                  Cancel
                </Button>

                {error && (
                  <div className="ml-4 text-sm text-red-600 break-words max-w-md">
                    {console.log("the error object i get: ", typeof error)}
                    {console.log(fieldErrors)}
                    {error}
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
