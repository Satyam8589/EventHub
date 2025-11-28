"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TicketModal from "@/components/TicketModal";
import EventHubLogo from "@/components/EventHubLogo";

// ===== UTILITY FUNCTIONS =====

// Parse date from database (stored as UTC)
const parseEventDate = (dateStr) => {
  if (!dateStr) return null;
  
  // Ensure proper UTC parsing
  if (dateStr.includes("T") && dateStr.includes("Z")) {
    return new Date(dateStr);
  } else if (dateStr.includes("T")) {
    return new Date(dateStr + "Z");
  } else {
    return new Date(dateStr.replace(" ", "T") + "Z");
  }
};

// Get event end date/time
const getEventEndDateTime = (event) => {
  // Parse event start date from database (UTC)
  const eventStartDate = parseEventDate(event.date);
  
  if (!eventStartDate || isNaN(eventStartDate.getTime())) {
    return null;
  }
  
  // If event has an end date, use it
  if (event.endDate || event.enddate) {
    const endDateValue = event.endDate || event.enddate;
    const eventEndDateTime = parseEventDate(endDateValue);
    
    if (eventEndDateTime && !isNaN(eventEndDateTime.getTime())) {
      return eventEndDateTime;
    }
  }
  
  // Fallback: use start date as end date (single-day event)
  return eventStartDate;
};

// Get event status
const getEventStatus = (event) => {
  if (!event || !event.date) return 'unknown';
  
  const now = new Date(); // Current time in UTC
  const eventStartDate = parseEventDate(event.date);
  const eventEndDateTime = getEventEndDateTime(event);
  
  if (!eventStartDate || isNaN(eventStartDate.getTime()) || 
      !eventEndDateTime || isNaN(eventEndDateTime.getTime())) {
    return 'unknown';
  }
  
  if (now < eventStartDate) return 'upcoming';
  if (now >= eventStartDate && now <= eventEndDateTime) return 'ongoing';
  return 'past';
};

// Format event date for display in IST
const formatEventDate = (dateString, timeString) => {
  const date = parseEventDate(dateString);
  if (!date || isNaN(date.getTime())) {
    return "Date TBD";
  }
  
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  };
  
  const formattedDate = date.toLocaleDateString("en-IN", options);
  
  if (timeString) {
    return `${formattedDate} at ${timeString}`;
  }
  
  // If no separate time string, extract time from the date
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  };
  const formattedTime = date.toLocaleTimeString("en-IN", timeOptions);
  return `${formattedDate} at ${formattedTime}`;
};

// ===== COMPONENTS =====

// Status Badge Component
const StatusBadge = ({ event }) => {
  const status = getEventStatus(event);
  
  switch (status) {
    case 'upcoming':
      return (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/80 text-white">
          Upcoming
        </span>
      );
    case 'ongoing':
      return (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/80 text-white animate-pulse">
          Live Now
        </span>
      );
    case 'past':
      return (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-500/80 text-white">
          Finished
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-500/80 text-white">
          Event
        </span>
      );
  }
};

// Event Date Display Component
const EventDateDisplay = ({ event }) => {
  const startDate = parseEventDate(event.date);
  const endDate = event.endDate ? parseEventDate(event.endDate) : null;

  if (!startDate || isNaN(startDate.getTime())) {
    return "Date TBD";
  }

  if (endDate && !isNaN(endDate.getTime()) && startDate.toDateString() !== endDate.toDateString()) {
    // Multi-day event
    return (
      <>
        {startDate.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          timeZone: "Asia/Kolkata",
        })} - {endDate.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })}{event.time ? ` • ${event.time}` : ""}
      </>
    );
  }
  
  // Single day event
  return formatEventDate(event.date, event.time);
};

// Completed Stamp Component
const CompletedStamp = ({ event }) => {
  const endDate = parseEventDate(event.endDate || event.enddate || event.date);
  
  return (
    <div className="relative flex items-center justify-center py-6 px-4">
      <div className="relative">
        {/* Outer Ring - Shadow Effect */}
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-800/30 border-4 border-green-600/40 transform rotate-12"></div>

        {/* Main Stamp Circle */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-600/40 to-green-800/60 border-4 border-green-500/60 flex flex-col items-center justify-center transform -rotate-6 transition-transform hover:rotate-0 duration-300">
          {/* Inner Circle */}
          <div className="w-16 h-16 rounded-full border-2 border-green-400/50 border-dashed flex flex-col items-center justify-center">
            {/* Checkmark Icon */}
            <div className="w-8 h-8 rounded-full bg-green-500/80 flex items-center justify-center mb-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Text */}
            <div className="text-center">
              <div className="text-green-200 text-[8px] font-bold uppercase tracking-wider leading-none">
                EVENT
              </div>
              <div className="text-green-100 text-[8px] font-bold uppercase tracking-wider leading-none">
                COMPLETED
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-1 left-3 w-1 h-1 rounded-full bg-green-300/60"></div>
          <div className="absolute top-3 right-1 w-1 h-1 rounded-full bg-green-300/60"></div>
          <div className="absolute bottom-1 right-3 w-1 h-1 rounded-full bg-green-300/60"></div>
          <div className="absolute bottom-3 left-1 w-1 h-1 rounded-full bg-green-300/60"></div>
        </div>

        {/* Date stamp effect */}
        <div className="absolute -bottom-2 -right-2 bg-green-700/80 text-green-100 text-[6px] font-mono px-1 py-0.5 rounded transform rotate-12">
          {endDate && !isNaN(endDate.getTime()) ? endDate.toLocaleDateString("en-IN", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
            timeZone: "Asia/Kolkata",
          }) : ""}
        </div>
      </div>
    </div>
  );
};

// Event Card Component
const EventCard = ({ booking, activeTab, onViewTicket }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-200 group">
    {/* Event Image */}
    <div className="relative h-32 overflow-hidden">
      <img
        src={booking.event.imageUrl || "/api/placeholder/400/200"}
        alt={booking.event.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 left-2">
        <StatusBadge event={booking.event} />
      </div>
    </div>

    {/* Event Details */}
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
        {booking.event.title}
      </h3>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-blue-400">📅</span>
          <span className="text-xs">
            <EventDateDisplay event={booking.event} />
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-purple-400">📍</span>
          <span className="text-xs line-clamp-1">
            {booking.event.location}
          </span>
        </div>
      </div>

      {/* Action Buttons or Completed Stamp */}
      {activeTab === "past" ? (
        <CompletedStamp event={booking.event} />
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onViewTicket(booking)}
              className="flex-1 bg-blue-600/20 text-white px-3 py-2 rounded-lg text-xs font-medium border border-blue-500/30 hover:bg-blue-600/30 transition-all"
            >
              View Ticket
            </button>
            <Link
              href={`/events/${booking.event.id}`}
              className="flex-1 bg-white/10 text-white px-3 py-2 rounded-lg text-xs font-medium border border-white/20 hover:bg-white/20 transition-all text-center"
            >
              Details
            </Link>
          </div>
        </div>
      )}
    </div>
  </div>
);

// Empty State Component
const EmptyState = ({ activeTab }) => (
  <div className="col-span-full text-center py-12">
    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20 max-w-md mx-auto">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">
        No {activeTab} events
      </h3>
      <p className="text-gray-300 mb-6">
        {activeTab === "upcoming"
          ? "You haven't booked any upcoming events yet. Discover amazing events happening near you!"
          : activeTab === "ongoing"
          ? "You don't have any ongoing events right now. Events that are currently happening will appear here."
          : "You don't have any past events yet. Your attended events will appear here."}
      </p>
      {activeTab === "upcoming" && (
        <Link
          href="/events"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Events
        </Link>
      )}
    </div>
  </div>
);

// Background Animation Component
const AnimatedBackground = ({ particles, mousePosition }) => (
  <div className="absolute inset-0">
    {/* Floating particles */}
    {particles.map((particle) => (
      <div
        key={particle.id}
        className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
        style={{
          left: `${particle.left}%`,
          top: `${particle.top}%`,
          animationDelay: `${particle.animationDelay}s`,
          animationDuration: `${particle.animationDuration}s`,
        }}
      />
    ))}

    {/* Moving gradient orbs */}
    <div
      className="absolute w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
      style={{
        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
      }}
    />
    <div
      className="absolute w-96 h-96 bg-gradient-to-r from-yellow-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 top-20 right-20"
      style={{
        transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
      }}
    />
    <div
      className="absolute w-96 h-96 bg-gradient-to-r from-green-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 bottom-20 left-20"
      style={{
        transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)`,
      }}
    />
  </div>
);

// Navigation Component
const Navigation = ({ user, authLoading, signOut }) => (
  <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-white font-bold text-lg sm:text-xl">
            EventHub
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {/* Admin Panel Link - Only show for admins */}
          {!authLoading && user && (user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN") && (
            <Link
              href="/admin"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium bg-blue-600/20 px-3 py-1 rounded-lg border border-blue-500/30"
            >
              🛡️ Admin Panel
            </Link>
          )}

          <Link
            href="/"
            className="text-white/80 hover:text-white transition-colors font-medium"
          >
            ← Back to Home
          </Link>

          {/* Desktop Sign Out Icon */}
          {user && (
            <button
              onClick={async () => {
                try {
                  const result = await signOut();
                  if (!result.error) {
                    window.location.reload();
                  }
                } catch (error) {
                  console.error("Error signing out:", error);
                }
              }}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

// Login Required Component
const LoginRequired = ({ redirectCountdown, particles, mousePosition, user, signOut }) => {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      <AnimatedBackground particles={particles} mousePosition={mousePosition} />
      <Navigation user={user} authLoading={false} signOut={signOut} />

      {/* Login Required Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <EventHubLogo size={64} showText={false} />
            </div>

            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-300 mb-2 leading-relaxed">
              Sign in to access your booked events, manage your tickets, and view your event history.
            </p>
            <p className="text-white/50 mb-6 text-sm">
              Redirecting to home page in{" "}
              <span className="text-blue-400 font-bold text-xl">
                {redirectCountdown}
              </span>{" "}
              seconds...
            </p>

            <div className="space-y-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Home & Sign In
              </Link>
              <button
                onClick={() => router.back()}
                className="w-full bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl transition-colors border border-white/20"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====

export default function MyEventsPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  // Mouse movement effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate particles
  useEffect(() => {
    const newParticles = [...Array(40)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 2,
      animationDuration: 2 + Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  // Redirect countdown when user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [authLoading, user, router]);

  // Fetch bookings function
  const fetchBookings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const cacheBuster = Date.now();
      const response = await fetch(
        `/api/bookings?userId=${user.uid}&status=CONFIRMED&_=${cacheBuster}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch bookings when user is available
  useEffect(() => {
    if (!authLoading) {
      fetchBookings();
    }
  }, [authLoading, fetchBookings]);

  // Refresh bookings when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchBookings();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, fetchBookings]);

  // Memoized filtered bookings - OPTIMIZED: Only filter once
  const categorizedBookings = useMemo(() => {
    const upcoming = [];
    const ongoing = [];
    const past = [];

    bookings.forEach((booking) => {
      // Safety check
      if (!booking.event || !booking.event.date) {
        return;
      }

      const status = getEventStatus(booking.event);
      
      switch (status) {
        case 'upcoming':
          upcoming.push(booking);
          break;
        case 'ongoing':
          ongoing.push(booking);
          break;
        case 'past':
          past.push(booking);
          break;
      }
    });

    return { upcoming, ongoing, past };
  }, [bookings]);

  // Handle view ticket
  const handleViewTicket = useCallback((booking) => {
    setSelectedTicket(booking);
    setShowTicketModal(true);
  }, []);

  // If user is not logged in, show login prompt
  if (!authLoading && !user) {
    return (
      <LoginRequired
        redirectCountdown={redirectCountdown}
        particles={particles}
        mousePosition={mousePosition}
        user={user}
        signOut={signOut}
      />
    );
  }

  // Get current bookings based on active tab
  const currentBookings = categorizedBookings[activeTab] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      <AnimatedBackground particles={particles} mousePosition={mousePosition} />
      <Navigation user={user} authLoading={authLoading} signOut={signOut} />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            My Events
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Manage your booked events and view your ticket history
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "upcoming"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Upcoming ({categorizedBookings.upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab("ongoing")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "ongoing"
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Ongoing ({categorizedBookings.ongoing.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "past"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Past Events ({categorizedBookings.past.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white/70">Loading your events...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentBookings.length === 0 ? (
              <EmptyState activeTab={activeTab} />
            ) : (
              currentBookings.map((booking) => (
                <EventCard
                  key={booking.id}
                  booking={booking}
                  activeTab={activeTab}
                  onViewTicket={handleViewTicket}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      <TicketModal
        booking={selectedTicket}
        isOpen={showTicketModal}
        onClose={() => {
          setShowTicketModal(false);
          setSelectedTicket(null);
        }}
      />
    </div>
  );
}
