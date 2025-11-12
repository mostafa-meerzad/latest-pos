"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Pencil, Trash2, Save } from "lucide-react";
import BackToDashboardButton from "@/components/BackToDashboardButton";
import SettingsImg from "@/assets/settings_img.png";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 5;

  // ----------------------------
  // 🔹 Fetch Users
  // ----------------------------
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const toastId = toast.loading("Loading users...");
      try {
        const res = await fetch("/api/users");
        const json = await res.json();

        if (json.success) {
          setUsers(json.data);
          toast.success("Users loaded successfully!", { id: toastId });
        } else {
          toast.error("Failed to fetch users.", { id: toastId });
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        toast.error("Error fetching users. Check console for details.", {
          id: toastId,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ----------------------------
  // 🔹 Inline Editing
  // ----------------------------
  function startEdit(row) {
    setEditingId(row.id);
    setEditValues({
      username: row.username,
      fullName: row.fullName,
      role: row.role?.name || row.role || "",
      password: "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
  }

  async function saveEdit() {
    if (!editingId || !editValues) return;
    if (saving) return toast("Already saving...");

    // 🔸 Validate fields before saving
    const { username, fullName, password, role } = editValues;

    if (!username.trim()) {
      toast.error("Username is required.");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (password.length > 0 && password.length < 6) {

      if(password.match(/" "/ig)){
        toast.error("' ' white space character cannot be included in the password!")
        return 
      }
      toast.error("Password is required and must be at least 6 characters.");
      return;
    }
    if (!role || role === "") {
      toast.error("Role is required.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Saving changes...");

    try {
      const res = await fetch(`/api/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to update user", { id: toastId });
        return;
      }

      if (data && data.id) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingId ? { ...u, ...data } : u))
        );
        cancelEdit();
        toast.success("User updated successfully!", { id: toastId });
      } else {
        toast.error("Invalid backend response.", { id: toastId });
      }
    } catch (err) {
      console.error("Error saving user:", err);
      toast.error("Something went wrong. Check console for details.", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------
  // 🔹 Delete User (with confirm + toast.promise)
  // ----------------------------
  async function deleteUser(id) {
    toast.custom((t) => (
      <div className="bg-white shadow-lg rounded-lg p-4 flex flex-col gap-3 border border-gray-200">
        <p className="text-gray-800 font-medium">
          Are you sure you want to delete this user?
        </p>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={async () => {
              toast.dismiss(t.id);
              toast.promise(
                (async () => {
                  const res = await fetch(`/api/users/${id}`, {
                    method: "DELETE",
                  });
                  const data = await res.json();

                  if (!res.ok || !data.deletedUser) {
                    throw new Error("Failed to delete user.");
                  }

                  setUsers((prev) => prev.filter((u) => u.id !== id));
                  return "User deleted successfully.";
                })(),
                {
                  loading: "Deleting user...",
                  success: "User deleted successfully!",
                  error: (err) =>
                    err.message || "Something went wrong while deleting.",
                }
              );
            }}
          >
            Yes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.dismiss(t.id)}
          >
            No
          </Button>
        </div>
      </div>
    ));
  }

  // ----------------------------
  // 🔹 Search + Pagination
  // ----------------------------
  const filteredData = useMemo(() => {
    let result = [...users];
    if (searchQuery) {
      result = result.filter((u) =>
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ----------------- Header ----------------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image
            src={SettingsImg}
            width={70}
            height={70}
            alt="settings page logo"
          />
          Settings
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/settings/add-user">
            <Button className="bg-green-400 hover:bg-green-500 text-md">
              New User
            </Button>
          </Link>
          <BackToDashboardButton />
        </div>
      </div>

      {/* ----------------- Search ----------------- */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative w-[250px]">
          <Input
            placeholder="Search by Name"
            className="pr-8 focus:!ring-[#f25500] focus:!border-[#f25500]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* ----------------- Table ----------------- */}
      {loading ? (
        <UsersTableSkeleton />
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-lg">
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0
                  ? paginatedData.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>#{u.id}</TableCell>
                        <TableCell>
                          {editingId === u.id ? (
                            <Input
                              required
                              value={editValues?.username || ""}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...s,
                                  username: e.target.value,
                                }))
                              }
                              className="w-[160px]"
                            />
                          ) : (
                            u.username
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === u.id ? (
                            <Input
                              required
                              value={editValues?.fullName || ""}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...s,
                                  fullName: e.target.value,
                                }))
                              }
                              className="w-[220px]"
                            />
                          ) : (
                            u.fullName
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === u.id ? (
                            <Input
                              required
                              minLength={6}
                              type="text"
                              placeholder="Enter new password"
                              value={editValues?.password || ""}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...s,
                                  password: e.target.value,
                                }))
                              }
                              className="w-[200px]"
                            />
                          ) : (
                            <Input
                              type="password"
                              value="********"
                              readOnly
                              className="w-[160px] bg-transparent border-none shadow-none cursor-default"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === u.id ? (
                            <Select
                              value={editValues?.role || ""}
                              onValueChange={(v) =>
                                setEditValues((s) => ({
                                  ...s,
                                  role: v,
                                }))
                              }
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="CASHIER">CASHIER</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            u.role?.name || "—"
                          )}
                        </TableCell>
                        <TableCell className="flex gap-2 ml-2">
                          {editingId === u.id ? (
                            <>
                              <Button
                                disabled={saving}
                                size="sm"
                                onClick={saveEdit}
                                className="bg-green-400 hover:bg-green-300 hover:text-green-800"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  toast("Edit canceled.");
                                  cancelEdit();
                                }}
                                className="hover:bg-gray-300 hover:text-gray-700"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => startEdit(u)}
                                className="hover:bg-gray-300 hover:text-gray-700"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUser(u.id)}
                                className="hover:bg-red-300 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ----------------- Pagination ----------------- */}
      {totalPages > 1 && (
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </Button>
          {[...Array(3)].map((_, i) => {
            let pageNumber;
            if (currentPage === 1) pageNumber = i + 1;
            else if (currentPage === totalPages)
              pageNumber = totalPages - 2 + i;
            else pageNumber = currentPage - 1 + i;

            if (pageNumber < 1 || pageNumber > totalPages) return null;

            return (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                className={
                  pageNumber === currentPage ? "bg-orange-500 text-white" : ""
                }
                size="sm"
                onClick={() => goToPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function UsersTableSkeleton() {
  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead className="text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
