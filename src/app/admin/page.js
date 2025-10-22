"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeEvents: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Navigation handlers
  const handleCreateEvent = () => {
    router.push("/admin/create-event");
  };

  // Check admin access
  useEffect(() => {
    // Wait for auth to complete and user to be loaded
    if (authLoading) return;

    // If no user, redirect
    if (!user) {
      router.push("/");
      return;
    }

    // If user exists but no role yet, wait a bit longer
    if (!user.role && user.dbUser === undefined) {
      return;
    }

    // If user has role but not admin, redirect
    if (user.role !== "SUPER_ADMIN" && user.role !== "EVENT_ADMIN") {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/admin/dashboard?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentActivity(data.recentActivity || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN")) {
      fetchDashboardData();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "EVENT_ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            You don't have permission to access the admin panel.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isSuper = user.role === "SUPER_ADMIN";

  return (
    <AdminLayout activeTab="dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-2xl border border-blue-500/30 p-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-blue-200">
            {isSuper
              ? "Manage your events, users, and platform settings from your super admin dashboard."
              : "Scan tickets and manage your assigned events."}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Events</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats.totalEvents}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "..." : stats.totalBookings}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎫</span>
              </div>
            </div>
          </div>

          {isSuper && (
            <>
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">
                      ${loading ? "..." : stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Active Events</p>
                    <p className="text-2xl font-bold text-white">
                      {loading ? "..." : stats.activeEvents}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isSuper ? (
              <>
                <button
                  onClick={handleCreateEvent}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-white p-4 rounded-lg text-left transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">➕</span>
                    <div>
                      <p className="font-medium">Create Event</p>
                      <p className="text-sm text-gray-300">Add a new event</p>
                    </div>
                  </div>
                </button>

                <button className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-white p-4 rounded-lg text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👥</span>
                    <div>
                      <p className="font-medium">Manage Admins</p>
                      <p className="text-sm text-gray-300">
                        Assign event admins
                      </p>
                    </div>
                  </div>
                </button>

                <button className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-white p-4 rounded-lg text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-medium">View Analytics</p>
                      <p className="text-sm text-gray-300">Check performance</p>
                    </div>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-white p-4 rounded-lg text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-medium">Scan Tickets</p>
                      <p className="text-sm text-gray-300">
                        Verify event tickets
                      </p>
                    </div>
                  </div>
                </button>

                <button className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-white p-4 rounded-lg text-left transition-all">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-medium">My Events</p>
                      <p className="text-sm text-gray-300">Events I manage</p>
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          {loading ? (
            <p className="text-gray-300">Loading activity...</p>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg"
                >
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-sm">📝</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-400 text-xs">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300">No recent activity</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
