"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";
import EventAnalyticsModal from "@/components/EventAnalyticsModal";

// Event Card Component - Extracted to reduce duplication
const EventCard = ({
  event,
  isSuper,
  onAnalytics,
  onGenerateReport,
  onAnnouncements,
  reportGenerating,
}) => (
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
    <div className="p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold text-white mb-2 line-clamp-1">
        {event.title}
      </h3>
      <p className="text-gray-300 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
        {event.description}
      </p>

      <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-blue-400 text-sm">📅</span>
          <span className="text-xs">
            {(() => {
              // Ensure proper UTC parsing for database dates
              const dateStr =
                event.date.includes("T") && event.date.includes("Z")
                  ? event.date
                  : event.date.includes("T")
                  ? event.date + "Z"
                  : event.date.replace(" ", "T") + "Z";

              const eventDate = new Date(dateStr);

              // Convert to IST and display
              return eventDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              });
            })()}{" "}
            at{" "}
            {(() => {
              const time = event.time;
              if (!time) return "";
              // If time is already formatted with AM/PM, use it directly
              if (time.includes("AM") || time.includes("PM")) {
                return time;
              }
              // If time is in 24-hour format (HH:MM or HH:MM:SS), convert to 12-hour with AM/PM
              const timeParts = time.split(":");
              if (timeParts.length >= 2) {
                let hours = parseInt(timeParts[0]);
                const minutes = timeParts[1];
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12;
                hours = hours ? hours : 12; // 0 should be 12
                return `${hours}:${minutes} ${ampm}`;
              }
              return time;
            })()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-purple-400 text-sm">📍</span>
          <span className="text-xs line-clamp-1">{event.location}</span>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-green-400 text-sm">🎫</span>
          <span className="text-xs">
            {event._count?.confirmedBookings || 0} bookings
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-1.5 md:space-y-2">
        <div className="flex gap-1.5 md:gap-2">
          {isSuper ? (
            <>
              <Link
                href={`/admin/events/${event.id}/edit`}
                className="flex-1 bg-blue-600/20 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium border border-blue-500/30 hover:bg-blue-600/30 transition-all text-center"
              >
                Edit
              </Link>
              <button
                onClick={() => onAnalytics(event.id)}
                className="flex-1 bg-green-600/20 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium border border-green-500/30 hover:bg-green-600/30 transition-all text-center"
              >
                Details
              </button>
              <Link
                href={`/admin/events/${event.id}/admins`}
                className="flex-1 bg-purple-600/20 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium border border-purple-500/30 hover:bg-purple-600/30 transition-all text-center"
              >
                Admins
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/admin/scanner?eventId=${event.id}`}
                className="flex-1 bg-blue-600/20 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium border border-blue-500/30 hover:bg-blue-600/30 transition-all text-center"
              >
                Scan
              </Link>
              <Link
                href={`/events/${event.id}`}
                className="flex-1 bg-white/10 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium border border-white/20 hover:bg-white/20 transition-all text-center"
              >
                View
              </Link>
            </>
          )}
        </div>

        {/* Second Row - Announcements and Report */}
        <div className="flex gap-1.5 md:gap-2">
          <button
            onClick={() => onAnnouncements(event)}
            className="flex-1 bg-indigo-600/20 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium border border-indigo-500/30 hover:bg-indigo-600/30 transition-all text-center flex items-center justify-center gap-1"
          >
            <span className="text-sm">📢</span>
            <span className="hidden sm:inline">Announcements</span>
            <span className="sm:hidden">Announce</span>
          </button>
          {isSuper && (
            <>
              <button
                onClick={() => onGenerateReport(event.id, event.title)}
                disabled={reportGenerating[event.id]}
                className="flex-1 bg-orange-600/20 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium border border-orange-500/30 hover:bg-orange-600/30 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportGenerating[event.id] ? "Sending..." : "📊 Report"}
              </button>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = `/api/admin/events/${event.id}/download-participants`;
                  link.download = `${event.title}_Participants.xlsx`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex-1 bg-teal-600/20 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium border border-teal-500/30 hover:bg-teal-600/30 transition-all text-center flex items-center justify-center gap-1"
                title="Download participants Excel"
              >
                <span className="hidden sm:inline">📥 Excel</span>
                <span className="sm:hidden">📥</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Helper function to ensure UTC format
const ensureUTCString = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes("T") && dateStr.endsWith("Z")) return dateStr;
  if (dateStr.includes("T")) return dateStr + "Z";
  return dateStr.replace(" ", "T") + "Z";
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

    if (
      event.endTime &&
      !endDateValue.includes("T") &&
      !endDateValue.includes(":")
    ) {
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
  const [announcementsModal, setAnnouncementsModal] = useState({
    isOpen: false,
    event: null,
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
    if (
      !confirm(
        `Generate and send report for "${eventTitle}" to the organizer's email?`
      )
    ) {
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
        alert(
          `✅ Report generated and sent successfully!\n\nSent to: ${data.message}`
        );
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

  // Handle announcements modal
  const handleAnnouncements = useCallback((event) => {
    setAnnouncementsModal({
      isOpen: true,
      event: event,
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
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {isSuper ? "Manage Events" : "My Events"}
            </h1>
            <p className="text-sm md:text-base text-gray-300">
              {isSuper
                ? "Create, edit, and manage all events on the platform"
                : "Events you're assigned to manage"}
            </p>
          </div>

          {isSuper && (
            <Link
              href="/admin/create-event"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-center"
            >
              + Create Event
            </Link>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-2 overflow-x-auto">
          <div className="flex space-x-2 min-w-max md:min-w-0">
            {["all", "upcoming", "ongoing", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all whitespace-nowrap ${
                  filter === status
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && (
                  <span className="ml-1 md:ml-2 text-xs opacity-75">
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
                  <h2 className="text-xl font-bold text-white">
                    Upcoming Events
                  </h2>
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
                        onAnnouncements={handleAnnouncements}
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
                  <h2 className="text-xl font-bold text-white">
                    Ongoing Events
                  </h2>
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
                        onAnnouncements={handleAnnouncements}
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
                  <h2 className="text-xl font-bold text-white">
                    Completed Events
                  </h2>
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
                        onAnnouncements={handleAnnouncements}
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
                      No {filter.charAt(0).toUpperCase() + filter.slice(1)}{" "}
                      Events
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

      {/* Announcements Modal */}
      <AnnouncementsModal
        event={announcementsModal.event}
        isOpen={announcementsModal.isOpen}
        onClose={() => setAnnouncementsModal({ isOpen: false, event: null })}
        user={user}
      />
    </AdminLayout>
  );
}

// Announcements Modal Component
function AnnouncementsModal({ event, isOpen, onClose, user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && event) {
      fetchAnnouncements();
    }
  }, [isOpen, event]);

  const fetchAnnouncements = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/events/${event.id}/announcements?userId=${user.uid}`
      );
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    setPostingAnnouncement(true);
    try {
      const res = await fetch(`/api/events/${event.id}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newAnnouncement,
          userId: user.uid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
        setNewAnnouncement("");
      }
    } catch (err) {
      console.error("Error posting announcement:", err);
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(
        `/api/events/${event.id}/announcements?announcementId=${announcementId}&userId=${user.uid}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl md:rounded-2xl border border-white/20 shadow-2xl w-full max-w-3xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 mr-2">
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-base md:text-xl">📢</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-xl font-bold text-white">
                Manage Announcements
              </h2>
              <p className="text-xs md:text-sm text-gray-400 line-clamp-1">
                {event?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white text-lg md:text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Post New Announcement */}
          <div className="p-3 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/5 border border-blue-500/20 shadow-lg">
            <h3 className="text-sm md:text-lg font-bold text-white mb-3 md:mb-4">
              Post New Announcement
            </h3>
            <div className="relative">
              <textarea
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Type your announcement here..."
                maxLength={1000}
                className="w-full bg-slate-900/50 border border-white/20 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all mb-2 min-h-[80px] md:min-h-[100px] resize-y shadow-inner"
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="text-xs text-gray-400 flex items-center gap-1.5 md:gap-2">
                  <svg
                    className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="line-clamp-1">
                    All ticket holders will receive a notification
                  </span>
                </div>
                <span
                  className={`text-xs font-medium ${
                    newAnnouncement.length > 900
                      ? "text-orange-400"
                      : "text-gray-400"
                  }`}
                >
                  {newAnnouncement.length}/1000
                </span>
              </div>
            </div>
            <button
              onClick={handlePostAnnouncement}
              disabled={!newAnnouncement.trim() || postingAnnouncement}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl text-sm md:text-base font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {postingAnnouncement ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 md:h-5 md:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Post Announcement
                </>
              )}
            </button>
          </div>

          {/* Announcements List */}
          <div>
            <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">
              Previous Announcements
            </h3>
            {loading ? (
              <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-400">
                Loading announcements...
              </div>
            ) : announcements && announcements.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="relative p-3 md:p-4 rounded-lg md:rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 md:gap-3 mb-2 md:mb-3">
                      <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-sm md:text-base">📢</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm font-semibold text-white">
                            Event Organizer
                          </div>
                          <div className="text-[10px] md:text-xs text-gray-400">
                            {new Date(
                              announcement.createdAt
                            ).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Kolkata",
                            })}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleDeleteAnnouncement(announcement.id)
                        }
                        className="flex-shrink-0 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs md:text-sm font-medium border border-red-500/20 hover:border-red-500/40 flex items-center gap-1 md:gap-1.5 transition-all"
                      >
                        <svg
                          className="w-3 h-3 md:w-4 md:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                    <p className="text-white/90 leading-relaxed whitespace-pre-wrap text-xs md:text-sm break-words pl-9 md:pl-11">
                      {announcement.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-400 text-sm">
                  No announcements posted yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
