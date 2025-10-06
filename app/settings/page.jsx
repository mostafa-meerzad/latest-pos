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

export default function SettingsPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);

  const itemsPerPage = 5;

  // ----------------------------
  // 🔹 Fetch Users
  // ----------------------------
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
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
      roleId: row.roleId,
      password: "", // keep blank until admin types a new one
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
  }

  async function saveEdit() {
    if (!editingId || !editValues) return;
    try {
      const res = await fetch(`/api/users/${editingId}`, {
        method: "PUT", // ✅ using your API
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      const data = await res.json();
      if (data.updatedUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingId ? { ...u, ...data.updatedUser } : u))
        );
        cancelEdit();
      } else {
        alert("Failed to update user");
      }
    } catch (err) {
      console.error("Error saving user:", err);
    }
  }

  async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.deletedUser) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
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
          <Button className={"bg-green-500 text-md"}>New User</Button>
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
              {paginatedData.length > 0 ? (
                paginatedData.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>#{u.id}</TableCell>

                    {/* Username */}
                    <TableCell>
                      {editingId === u.id ? (
                        <Input
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

                    {/* Full Name */}
                    <TableCell>
                      {editingId === u.id ? (
                        <Input
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

                    {/* Password */}
                    <TableCell>
                      {editingId === u.id ? (
                        <Input
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

                    {/* Role */}
                    <TableCell>
                      {editingId === u.id ? (
                        <Select
                          value={String(editValues?.roleId)}
                          onValueChange={(v) =>
                            setEditValues((s) => ({
                              ...s,
                              roleId: Number(v),
                            }))
                          }
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">ADMIN</SelectItem>
                            <SelectItem value="2">MANAGER</SelectItem>
                            <SelectItem value="3">CASHIER</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        u.role?.name
                      )}
                    </TableCell>

                    

                    {/* Actions */}
                    <TableCell className="flex gap-2 ml-2">
                      {editingId === u.id ? (
                        <>
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
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
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(u.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ----------------- Pagination ----------------- */}
      {totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lt;
          </Button>

          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                className={
                  page === currentPage ? "bg-orange-500 text-white" : ""
                }
                size="sm"
                onClick={() => goToPage(page)}
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &gt;
          </Button>
        </div>
      )}
    </div>
  );
}
