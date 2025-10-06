"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function AddUserPage() {
  const router = useRouter();

  // form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");

  // ui state
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim() || !fullName.trim() || !role.trim()) {
      return setError("All fields are required.");
    }

    setSubmitting(true);
    try {
      const body = {
        username: username.trim(),
        password: password.trim(),
        fullName: fullName.trim(),
        role: role.trim(),
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/settings"); 
      } else {
        const msg =
          data?.error?.message ||
          data?.error ||
          JSON.stringify(data?.error || data) ||
          "Failed to create user";
        setError(msg);
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Add User</h1>
        <Link href="/settings">
          <Button variant="outline">Back to Users</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="text-sm font-medium block mb-1">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium block mb-1">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium block mb-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-sm font-medium block mb-1">Role</label>
                <Select value={role} onValueChange={(val) => setRole(val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="MANAGER">MANAGER</SelectItem>
                    <SelectItem value="CASHIER">CASHIER</SelectItem>
                    <SelectItem value="STOCK_MANAGER">STOCK_MANAGER</SelectItem>
                    <SelectItem value="DELIVERY_DRIVER">DELIVERY_DRIVER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* form actions */}
            <div className="mt-6 flex items-center gap-3">
              <Button type="submit" className="bg-orange-500" disabled={submitting}>
                {submitting ? "Saving..." : "Create User"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/users")}>
                Cancel
              </Button>

              {error && <div className="ml-4 text-sm text-red-600">{String(error)}</div>}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
