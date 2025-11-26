"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";
import EventAnalyticsModal from "@/components/EventAnalyticsModal";

// Event Card Component - Extracted to reduce duplication
const EventCard = ({ event, isSuper, onAnalytics, onGenerateReport, reportGenerating }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all group">
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
            event.calculatedStatus === "upcoming"
              ? "bg-green-500/80 text-white"
              : event.calculatedStatus === "ongoing"
              ? "bg-blue-500/80 text-white"
              : "bg-gray-500/80 text-white"
          }`}
        >
          {event.calculatedStatus.toUpperCase()}
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
            {new Date(event.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })} at{" "}
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
            <button
              onClick={() => onAnalytics(event.id)}
              className="flex-1 bg-green-600/20 text-white px-3 py-2 rounded-lg text-xs font-medium border border-green-500/30 hover:bg-green-600/30 transition-all text-center"
            >
              Details
            </button>
            <Link
              href={`/admin/events/${event.id}/admins`}
              className="flex-1 bg-purple-600/20 text-white px-3 py-2 rounded-lg text-xs font-medium border border-purple-500/30 hover:bg-purple-600/30 transition-all text-center"
            >
              Admins
            </Link>
            <button
              onClick={() => onGenerateReport(event.id, event.title)}
              disabled={reportGenerating[event.id]}
              className="flex-1 bg-orange-600/20 text-white px-3 py-2 rounded-lg text-xs font-medium border border-orange-500/30 hover:bg-orange-600/30 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reportGenerating[event.id] ? "Sending..." : "📊 Report"}
            </button>
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
);

// Helper function to ensure UTC format
const ensureUTCString = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes('T') && dateStr.endsWith('Z')) return dateStr;
  if (dateStr.includes('T')) return dateStr + 'Z';
  return dateStr.replace(' ', 'T') + 'Z';
};

// Calculate event status based on dates
const calculateEventStatus = (event) => {
  const now = new Date();
  const eventStartDate = new Date(ensureUTCString(event.date));

  let eventEndDateTime;
  const endDateValue = event.endDate || event.enddate;
  
  if (endDateValue) {
    const utcEndDate = ensureUTCString(endDateValue);
    eventEndDateTime = new Date(utcEndDate);
    
    if (event.endTime && !endDateValue.includes("T") && !endDateValue.includes(":")) {
      const combinedDateTime = `${endDateValue}T${event.endTime}Z`;
      eventEndDateTime = new Date(combinedDateTime);
    }
  } else {
    if (event.time) {
      const combinedDateTime = `${event.date.split("T")[0]}T${event.time}`;
      eventEndDateTime = new Date(ensureUTCString(combinedDateTime));
      if (isNaN(eventEndDateTime.getTime())) {
        eventEndDateTime = new Date(eventStartDate);
        eventEndDateTime.setHours(23, 59, 59, 999);
      }
    } else {
      eventEndDateTime = new Date(eventStartDate);
      eventEndDateTime.setHours(23, 59, 59, 999);
    }
  }

  if (now < eventStartDate) {
    return "upcoming";
  } else if (now >= eventStartDate && now <= eventEndDateTime) {
    return "ongoing";
  } else {
    return "completed";
  }
};

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [analyticsModal, setAnalyticsModal] = useState({
    isOpen: false,
    eventId: null,
  });
  const [reportGenerating, setReportGenerating] = useState({});

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
  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      const adminUserId =
        user.role === "EVENT_ADMIN"
          ? user.dbUser?.id || user.id || user.uid
          : undefined;
      const endpoint =
        user.role === "SUPER_ADMIN"
          ? "/api/admin/events"
          : `/api/admin/events?adminUserId=${adminUserId}`;

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
  }, [user]);

  useEffect(() => {
    if (user && (user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN")) {
      fetchEvents();
    }
  }, [user, fetchEvents]);

  // Handle report generation
  const handleGenerateReport = useCallback(async (eventId, eventTitle) => {
    if (!confirm(`Generate and send report for "${eventTitle}" to the organizer's email?`)) {
      return;
    }

    setReportGenerating((prev) => ({ ...prev, [eventId]: true }));

    try {
      const response = await fetch("/api/admin/generate-event-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Report generated and sent successfully!\n\nSent to: ${data.message}`);
      } else {
        alert(`❌ Error: ${data.error}\n${data.details || ""}`);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("❌ Failed to generate report. Please try again.");
    } finally {
      setReportGenerating((prev) => ({ ...prev, [eventId]: false }));
    }
  }, []);

  // Handle analytics modal
  const handleAnalytics = useCallback((eventId) => {
    setAnalyticsModal({
      isOpen: true,
      eventId: eventId,
    });
  }, []);

  // Memoized event grouping by status
  const eventsByStatus = useMemo(() => {
    const grouped = {
      upcoming: [],
      ongoing: [],
      completed: [],
    };

    events.forEach((event) => {
      const status = calculateEventStatus(event);
      event.calculatedStatus = status;
      grouped[status].push(event);
    });

    return grouped;
  }, [events]);

  // Memoized filtered events
  const filteredEventsByStatus = useMemo(() => {
    if (filter === "all") {
      return eventsByStatus;
    }
    
    return {
      upcoming: filter === "upcoming" ? eventsByStatus.upcoming : [],
      ongoing: filter === "ongoing" ? eventsByStatus.ongoing : [],
      completed: filter === "completed" ? eventsByStatus.completed : [],
    };
  }, [filter, eventsByStatus]);

  const isSuper = user?.role === "SUPER_ADMIN";

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
              href="/admin/create-event"
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
                {status !== "all" && (
                  <span className="ml-2 text-xs opacity-75">
                    ({eventsByStatus[status]?.length || 0})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
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
                  href="/admin/create-event"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  + Create Event
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Events Section */}
            {(filter === "all" || filter === "upcoming") && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-green-400 rounded-full"></div>
                  <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    {filteredEventsByStatus.upcoming.length}
                  </span>
                </div>
                {filteredEventsByStatus.upcoming.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEventsByStatus.upcoming.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isSuper={isSuper}
                        onAnalytics={handleAnalytics}
                        onGenerateReport={handleGenerateReport}
                        reportGenerating={reportGenerating}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-gray-400 text-sm">No upcoming events</p>
                  </div>
                )}
              </div>
            )}

            {/* Ongoing Events Section */}
            {(filter === "all" || filter === "ongoing") && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"></div>
                  <h2 className="text-xl font-bold text-white">Ongoing Events</h2>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                    {filteredEventsByStatus.ongoing.length}
                  </span>
                </div>
                {filteredEventsByStatus.ongoing.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEventsByStatus.ongoing.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isSuper={isSuper}
                        onAnalytics={handleAnalytics}
                        onGenerateReport={handleGenerateReport}
                        reportGenerating={reportGenerating}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-gray-400 text-sm">No ongoing events</p>
                  </div>
                )}
              </div>
            )}

            {/* Completed Events Section */}
            {(filter === "all" || filter === "completed") && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-12 bg-gradient-to-r from-gray-500 to-gray-400 rounded-full"></div>
                  <h2 className="text-xl font-bold text-white">Completed Events</h2>
                  <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">
                    {filteredEventsByStatus.completed.length}
                  </span>
                </div>
                {filteredEventsByStatus.completed.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEventsByStatus.completed.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isSuper={isSuper}
                        onAnalytics={handleAnalytics}
                        onGenerateReport={handleGenerateReport}
                        reportGenerating={reportGenerating}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-gray-400 text-sm">No completed events</p>
                  </div>
                )}
              </div>
            )}

            {/* Show message if no events in filtered sections */}
            {filter !== "all" && 
             filteredEventsByStatus.upcoming.length === 0 && 
             filteredEventsByStatus.ongoing.length === 0 && 
             filteredEventsByStatus.completed.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-12 max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    No {filter.charAt(0).toUpperCase() + filter.slice(1)} Events
                  </h3>
                  <p className="text-gray-300 mb-6">
                    There are no {filter} events at this time.
                  </p>
                  <button
                    onClick={() => setFilter("all")}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    View All Events
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      <EventAnalyticsModal
        eventId={analyticsModal.eventId}
        isOpen={analyticsModal.isOpen}
        onClose={() => setAnalyticsModal({ isOpen: false, eventId: null })}
      />
    </AdminLayout>
  );
}
