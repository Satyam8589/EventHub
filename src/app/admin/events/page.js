"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, ongoing, completed

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Check admin access
  useEffect(() => {
    if (
      !authLoading &&
      (!user || (user.role !== "SUPER_ADMIN" && user.role !== "EVENT_ADMIN"))
    ) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        const endpoint =
          user.role === "SUPER_ADMIN"
            ? "/api/admin/events"
            : `/api/admin/events?adminUserId=${user.uid}`;

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN")) {
      fetchEvents();
    }
  }, [user]);

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    return event.status.toLowerCase() === filter.toLowerCase();
  });

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
            You don't have permission to access this page.
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
    <AdminLayout activeTab="events">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isSuper ? "Manage Events" : "My Events"}
            </h1>
            <p className="text-gray-300">
              {isSuper
                ? "Create, edit, and manage all events on the platform"
                : "Events you're assigned to manage"}
            </p>
          </div>

          {isSuper && (
            <Link
              href="/admin/events/create"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              + Create Event
            </Link>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-2">
          <div className="flex space-x-2">
            {["all", "upcoming", "ongoing", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white">Loading events...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-12 max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                No Events Found
              </h3>
              <p className="text-gray-300 mb-6">
                {isSuper
                  ? "Create your first event to get started"
                  : "You haven't been assigned to any events yet"}
              </p>
              {isSuper && (
                <Link
                  href="/admin/events/create"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  + Create Event
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all group"
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.imageUrl || "/api/placeholder/400/300"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === "UPCOMING"
                          ? "bg-green-500/80 text-white"
                          : event.status === "ONGOING"
                          ? "bg-blue-500/80 text-white"
                          : "bg-gray-500/80 text-white"
                      }`}
                    >
                      {event.status}
                    </span>
                    {event.featured && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-yellow-600 text-white flex items-center gap-1">
                        <span>⭐</span>
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
                    {event.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-white/80">
                      <span className="text-blue-400">📅</span>
                      <span className="text-xs">
                        {new Date(event.date).toLocaleDateString()} at{" "}
                        {event.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <span className="text-purple-400">📍</span>
                      <span className="text-xs line-clamp-1">
                        {event.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <span className="text-green-400">🎫</span>
                      <span className="text-xs">
                        {event._count?.bookings || 0} bookings
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isSuper ? (
                      <>
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="flex-1 bg-blue-600/20 text-white px-3 py-2 rounded-lg text-xs font-medium border border-blue-500/30 hover:bg-blue-600/30 transition-all text-center"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/admins`}
                          className="flex-1 bg-purple-600/20 text-white px-3 py-2 rounded-lg text-xs font-medium border border-purple-500/30 hover:bg-purple-600/30 transition-all text-center"
                        >
                          Admins
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/admin/scanner?eventId=${event.id}`}
                          className="flex-1 bg-blue-600/20 text-white px-3 py-2 rounded-lg text-xs font-medium border border-blue-500/30 hover:bg-blue-600/30 transition-all text-center"
                        >
                          Scan Tickets
                        </Link>
                        <Link
                          href={`/events/${event.id}`}
                          className="flex-1 bg-white/10 text-white px-3 py-2 rounded-lg text-xs font-medium border border-white/20 hover:bg-white/20 transition-all text-center"
                        >
                          View Event
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
