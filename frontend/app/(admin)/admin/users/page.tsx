"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ApiClient from "@/utils/ApiClient";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  Shield,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import Image from "next/image";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search) {
        params.search = search;
      }

      const response = await ApiClient.get("/admin/users", { params });

      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on search
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    if (
      !confirm(
        `Are you sure you want to ${currentStatus ? "remove" : "grant"} admin access for this user?`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(userId);
      const response = await ApiClient.put(`/admin/users/${userId}`, {
        isAdmin: !currentStatus,
      });

      if (response.data.success) {
        toast.success(
          `User ${currentStatus ? "removed from" : "granted"} admin access`,
        );
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(userId);
      const response = await ApiClient.delete(`/admin/users/${userId}`);

      if (response.data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage all registered users on the platform
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchUsers} variant="outline">
            Refresh
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Total Users</div>
          <div className="mt-2 text-2xl font-bold">{pagination.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Current Page</div>
          <div className="mt-2 text-2xl font-bold">
            {pagination.page} of {pagination.totalPages}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Showing</div>
          <div className="mt-2 text-2xl font-bold">{users.length} users</div>
        </Card>
      </div>

      {/* Users Table */}
      {loading ? (
        <Card className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground">No users found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold">User</th>
                  <th className="p-4 text-left text-sm font-semibold">
                    Contact
                  </th>
                  <th className="p-4 text-left text-sm font-semibold">
                    Joined
                  </th>
                  <th className="p-4 text-left text-sm font-semibold">Role</th>
                  <th className="p-4 text-right text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-border hover:bg-muted/30 border-t transition-colors"
                  >
                    {/* User Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.name || "User"}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                            {user.name?.[0]?.toUpperCase() ||
                              user.email[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {user.name || "No Name"}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Mail size={12} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4">
                      {user.phone ? (
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Phone size={14} />
                          {user.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No phone
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="p-4">
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Calendar size={14} />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      {user.isAdmin ? (
                        <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
                          <Shield size={12} />
                          Admin
                        </span>
                      ) : (
                        <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
                          <User size={12} />
                          User
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleAdminStatus(user.id, user.isAdmin)
                          }
                          disabled={actionLoading === user.id}
                          title={
                            user.isAdmin
                              ? "Remove admin access"
                              : "Grant admin access"
                          }
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.isAdmin ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            deleteUser(user.id, user.name || user.email)
                          }
                          disabled={actionLoading === user.id}
                          title="Delete user"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="border-border flex items-center justify-between border-t p-4">
              <div className="text-muted-foreground text-sm">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }))
                  }
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                  disabled={
                    pagination.page === pagination.totalPages || loading
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
