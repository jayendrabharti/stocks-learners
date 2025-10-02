"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, MessageSquare, TrendingUp, Activity } from "lucide-react";
import ApiClient from "@/utils/ApiClient";
import { toast } from "sonner";

interface DashboardStats {
  totalUsers: number;
  pendingContacts: number;
  totalContacts: number;
  newUsersToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingContacts: 0,
    totalContacts: 0,
    newUsersToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await ApiClient.get("/admin/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Pending Contacts",
      value: stats.pendingContacts,
      icon: MessageSquare,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Total Contacts",
      value: stats.totalContacts,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "New Users Today",
      value: stats.newUsersToday,
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the admin panel. Here's an overview of your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {stat.title}
                </p>
                <h3 className="mt-2 text-3xl font-bold">
                  {loading ? "..." : stat.value}
                </h3>
              </div>
              <div className={`${stat.bgColor} ${stat.color} rounded-lg p-3`}>
                <stat.icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:border-primary cursor-pointer p-6 transition-all">
            <a href="/admin/users">
              <h3 className="mb-2 font-semibold">Manage Users</h3>
              <p className="text-muted-foreground text-sm">
                View and manage all registered users on the platform.
              </p>
            </a>
          </Card>

          <Card className="hover:border-primary cursor-pointer p-6 transition-all">
            <a href="/admin/contact-forms">
              <h3 className="mb-2 font-semibold">Review Contact Forms</h3>
              <p className="text-muted-foreground text-sm">
                Check and respond to user inquiries and feedback.
              </p>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
