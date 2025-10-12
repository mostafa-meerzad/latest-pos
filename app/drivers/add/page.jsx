"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateDriverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  // form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // UI state
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim()) {
      return setError("Name and phone are required.");
    }

    if (!/^[0-9]+$/.test(phone.trim())) {
      return setError("Phone number must contain only digits.");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (from === "drivers") {
          router.push("/drivers");
        } else {
          router.push("/delivery");
        }
      } else {
        setError(data?.error || "Failed to create driver");
      }
    } catch (err) {
      console.error("Error creating driver:", err);
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Add Delivery Driver</h1>
        <Link href="/drivers">
          <Button variant="outline" className={"drop-shadow-2xl"}>
            Back to Drivers
          </Button>
        </Link>
      </div>

      <div className="flex justify-center">
        <form onSubmit={handleSubmit} className="min-w-4xl drop-shadow-2xl">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Driver Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      error ? "Name is require" : "Enter driver name"
                    }
                    className={error ? "border-red-500" : ""}
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
                    placeholder={
                      error ? "Phone number is require" : "Enter phone number"
                    }
                    className={error ? "border-red-500" : ""}
                  />
                </div>
              </div>

              {/* form actions */}
              <div className="mt-6 flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-orange-500"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Create Driver"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    router.push(from === "drivers" ? "/drivers" : "/delivery")
                  }
                >
                  Cancel
                </Button>

                {error && (
                  <div className="ml-4 text-sm text-red-600">
                    {/* {console.log(error)} */}
                    {error !== "Name and phone are required." && String(error)}
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
