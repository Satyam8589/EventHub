"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({ children, activeTab = "dashboard" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  const superAdminTabs = [
    { id: "dashboard", name: "Dashboard", icon: "📊", href: "/admin" },
    {
      id: "create-event",
      name: "Create Event",
      icon: "➕",
      href: "/admin/create-event",
    },
    { id: "events", name: "Manage Events", icon: "🎯", href: "/admin/events" },
    { id: "users", name: "User Management", icon: "👥", href: "/admin/users" },
    {
      id: "analytics",
      name: "Analytics",
      icon: "📈",
      href: "/admin/analytics",
    },
    { id: "settings", name: "Settings", icon: "⚙️", href: "/admin/settings" },
  ];

  const eventAdminTabs = [
    { id: "dashboard", name: "Dashboard", icon: "📊", href: "/admin" },
    {
      id: "scanner",
      name: "Ticket Scanner",
      icon: "📱",
      href: "/admin/scanner",
    },
    { id: "events", name: "My Events", icon: "🎯", href: "/admin/events" },
  ];

  const isSuper = user?.role === "SUPER_ADMIN";
  const tabs = isSuper ? superAdminTabs : eventAdminTabs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/90 backdrop-blur-md border-r border-white/10 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-white font-bold text-lg">EventHub</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0) || "A"}
              </span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user?.name}</p>
              <p className="text-gray-400 text-xs">
                {isSuper ? "Super Admin" : "Event Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4 space-y-2">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.name}</span>
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-md border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white text-sm font-medium"
              >
                ← Back to Site
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
