"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

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

    // --- Validation ---
    if (!fullName.trim()) {
      const msg = "Full name is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!username.trim()) {
      const msg = "Username is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!password.trim()) {
      const msg = "Password is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!role.trim()) {
      const msg = "Role is required.";
      setError(msg);
      toast.error(msg);
      return;
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
        toast.success("User created successfully!");
        router.push("/settings");
      } else {
        const msg =
          data?.error?.message ||
          data?.error ||
          JSON.stringify(data?.error || data) ||
          "Failed to create user.";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error("Error creating user:", err);
      const msg = err.message || "Network error.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-14">
        <h1 className="text-3xl font-bold">Add User</h1>
        <Link href="/settings">
          <Button variant="outline">Back to Users</Button>
        </Link>
      </div>

      <div className="flex justify-center drop-shadow-2xl">
        <form onSubmit={handleSubmit} className="min-w-3xl">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Full Name
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Username
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="text-sm font-medium block mb-1">Role</label>
                  <Select value={role} onValueChange={(val) => setRole(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="CASHIER">CASHIER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* form actions */}
              <div className="mt-6 flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-orange-400 hover:bg-orange-500 text-white"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Create User"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/settings")}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
