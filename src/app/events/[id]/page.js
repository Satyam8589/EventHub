"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import BookingModal from "@/components/BookingModal";
import { supabase } from "@/lib/supabase";

export default function Page({ params }) {
  const p = use(params);
  const { user, signOut } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [scrollY, setScrollY] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [canViewAnnouncements, setCanViewAnnouncements] = useState(false);
  const [isEventAdmin, setIsEventAdmin] = useState(false);
  const [userTotalTickets, setUserTotalTickets] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Helper function to check if event is expired
  const isEventExpired = (event) => {
    if (!event) return false;

    const now = new Date();

    // Check if event is cancelled
    if (event.status === "CANCELLED") {
      return true;
    }

    // If event has endDate, use it to determine if event is expired
    const endDateValue = event.endDate || event.enddate;
    if (endDateValue) {
      const endDate = new Date(endDateValue);
      return endDate <= now;
    }

    // If no endDate, consider it a single-day event
    const eventDate = new Date(event.date);
    const eventDateOnly = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    );
    const nowDateOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return eventDateOnly < nowDateOnly;
  };

  // Helper function to convert URLs in text to clickable links
  const linkifyText = (text) => {
    if (!text) return "";

    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Replace URLs with anchor tags with word-break styles
    const linkedText = text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline transition-colors" style="word-break: break-all; overflow-wrap: anywhere;">${url}</a>`;
    });

    // Also handle line breaks
    return linkedText.replace(/\n/g, "<br />");
  };

  // Check if event has started using IST timezone
  const hasEventStarted = () => {
    if (!event) return false;

    try {
      // Helper to ensure proper UTC format
      const ensureUTCString = (dateStr) => {
        if (!dateStr) return null;
        if (dateStr.includes("T") && dateStr.endsWith("Z")) return dateStr;
        if (dateStr.includes("T")) return dateStr + "Z";
        return dateStr.replace(" ", "T") + "Z";
      };

      // Parse the start date (stored as UTC in database)
      const startDateUTC = new Date(ensureUTCString(event.date));

      // Convert start date to IST date string
      const startDateISTString = startDateUTC.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      // Parse the IST date string (format: MM/DD/YYYY)
      const [startMonth, startDay, startYear] = startDateISTString
        .split("/")
        .map((num) => parseInt(num));

      // Parse event start time
      let startHours = 0,
        startMinutes = 0;
      const startTimeValue = event.time;

      if (!startTimeValue) return false;

      if (startTimeValue.includes("AM") || startTimeValue.includes("PM")) {
        // 12-hour format
        const match = startTimeValue.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          startHours = parseInt(match[1]);
          startMinutes = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === "PM" && startHours !== 12) startHours += 12;
          if (period === "AM" && startHours === 12) startHours = 0;
        }
      } else {
        // 24-hour format
        const parts = startTimeValue.split(":");
        if (parts.length >= 2) {
          startHours = parseInt(parts[0]);
          startMinutes = parseInt(parts[1]);
        }
      }

      // Create event start datetime in IST (month is 0-indexed)
      const eventStartIST = new Date(
        startYear,
        startMonth - 1,
        startDay,
        startHours,
        startMinutes,
        0
      );

      // Get current time in IST
      const now = new Date();
      const nowISTString = now.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // Parse current IST time
      const [datePartNow, timePartNow] = nowISTString.split(", ");
      const [monthNow, dayNow, yearNow] = datePartNow
        .split("/")
        .map((num) => parseInt(num));
      const [hoursNow, minutesNow, secondsNow] = timePartNow
        .split(":")
        .map((num) => parseInt(num));
      const nowISTDate = new Date(
        yearNow,
        monthNow - 1,
        dayNow,
        hoursNow,
        minutesNow,
        secondsNow
      );

      return nowISTDate >= eventStartIST;
    } catch (error) {
      console.error("Error calculating event start time:", error);
      return false;
    }
  };

  // Check if event has ended using IST timezone
  const hasEventEnded = () => {
    if (!event) return false;

    const endDateValue = event.endDate || event.enddate;
    const endTimeValue = event.endTime || event.endtime;

    if (!endDateValue || !endTimeValue) return false;

    try {
      // Helper to ensure proper UTC format
      const ensureUTCString = (dateStr) => {
        if (!dateStr) return null;
        if (dateStr.includes("T") && dateStr.endsWith("Z")) return dateStr;
        if (dateStr.includes("T")) return dateStr + "Z";
        return dateStr.replace(" ", "T") + "Z";
      };

      // Parse the end date (stored as UTC in database)
      const endDateUTC = new Date(ensureUTCString(endDateValue));

      // Convert end date to IST date string
      const endDateISTString = endDateUTC.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      // Parse the IST date string (format: MM/DD/YYYY)
      const [endMonth, endDay, endYear] = endDateISTString
        .split("/")
        .map((num) => parseInt(num));

      // Parse event end time
      let endHours = 0,
        endMinutes = 0;

      if (endTimeValue.includes("AM") || endTimeValue.includes("PM")) {
        // 12-hour format
        const match = endTimeValue.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          endHours = parseInt(match[1]);
          endMinutes = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === "PM" && endHours !== 12) endHours += 12;
          if (period === "AM" && endHours === 12) endHours = 0;
        }
      } else {
        // 24-hour format
        const parts = endTimeValue.split(":");
        if (parts.length >= 2) {
          endHours = parseInt(parts[0]);
          endMinutes = parseInt(parts[1]);
        }
      }

      // Create event end datetime in IST (month is 0-indexed)
      const eventEndIST = new Date(
        endYear,
        endMonth - 1,
        endDay,
        endHours,
        endMinutes,
        0
      );

      // Get current time in IST
      const now = new Date();
      const nowISTString = now.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // Parse current IST time
      const [datePartNow, timePartNow] = nowISTString.split(", ");
      const [monthNow, dayNow, yearNow] = datePartNow
        .split("/")
        .map((num) => parseInt(num));
      const [hoursNow, minutesNow, secondsNow] = timePartNow
        .split(":")
        .map((num) => parseInt(num));
      const nowISTDate = new Date(
        yearNow,
        monthNow - 1,
        dayNow,
        hoursNow,
        minutesNow,
        secondsNow
      );

      return nowISTDate > eventEndIST;
    } catch (error) {
      console.error("Error calculating event end time:", error);
      return false;
    }
  };

  useEffect(() => {
    if (user && event) {
      const fetchUserBookings = async () => {
        setLoadingBookings(true);
        const { data, error } = await supabase
          .from("bookings")
          .select("tickets")
          .eq("eventId", event.id)
          .eq("userId", user.uid)
          .eq("status", "CONFIRMED");

        if (error) {
          console.error("Error fetching user bookings:", error);
        } else {
          const totalTickets = data.reduce(
            (sum, booking) => sum + booking.tickets,
            0
          );
          setUserTotalTickets(totalTickets);
        }
        setLoadingBookings(false);
      };

      fetchUserBookings();
    } else {
      setLoadingBookings(false);
    }
  }, [user, event]);

  useEffect(() => {
    if (!p?.id) return;

    console.log("Fetching event details for ID:", p.id);

    // Add cache buster to force fresh data
    const cacheBuster = Date.now();

    fetch(`/api/events/${p.id}?_=${cacheBuster}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        console.log("Event Detail Page - Event data:", {
          eventId: data.event?.id,
          title: data.event?.title,
          imageUrl: data.event?.imageUrl,
          gallery: data.event?.gallery,
          bookingsCount: data.event?._count?.bookings,
          capacity: data.event?.capacity,
          // Debug endtime fields
          endTime: data.event?.endTime,
          endtime: data.event?.endtime,
          endDate: data.event?.endDate,
          enddate: data.event?.enddate,
          time: data.event?.time,
        });
        setEvent(data.event);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [p?.id]);

  // Fetch announcements separately
  useEffect(() => {
    if (!p?.id) return;

    const fetchAnnouncements = async () => {
      try {
        const userId = user?.uid || "";
        const res = await fetch(
          `/api/events/${p.id}/announcements?userId=${userId}`
        );
        const data = await res.json();

        setAnnouncements(data.announcements || []);
        setCanViewAnnouncements(data.canView || false);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };

    fetchAnnouncements();
  }, [p?.id, user]);

  // Check if user is admin of this event
  useEffect(() => {
    if (!user || !event) return;

    const checkAdminStatus = async () => {
      try {
        // Check if user is event creator
        if (event.userId === user.uid) {
          setIsEventAdmin(true);
          return;
        }

        // Check if user is assigned admin
        const { data } = await supabase
          .from("event_admins")
          .select("id")
          .eq("event_id", event.id) // Changed from eventId to event_id
          .eq("user_id", user.uid) // Changed from userId to user_id
          .single();

        setIsEventAdmin(!!data);
      } catch (err) {
        console.error("Error checking admin status:", err);
      }
    };

    checkAdminStatus();
  }, [user, event]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Generate particles on client side only to avoid hydration issues
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [...Array(40)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 3,
        animationDuration: 3 + Math.random() * 4,
      }));
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-xl font-medium text-white">Loading Event...</div>
          <div className="text-sm text-gray-400 mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-5xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Event Not Found
          </h2>
          <p className="text-gray-400 mb-8">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
          >
            <span>←</span>
            <span>Back to Events</span>
          </Link>
        </div>
      </div>
    );
  }

  const availableSpots = event.capacity - (event._count?.bookings || 0);
  const bookedPercentage =
    ((event.capacity - availableSpots) / event.capacity) * 100;

  const hasBookingLimit =
    event.max_tickets_per_user && event.max_tickets_per_user > 0;
  const userReachedLimit =
    hasBookingLimit && userTotalTickets >= event.max_tickets_per_user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Enhanced Professional Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            transform: `translate(${mousePosition.x * 0.005}px, ${
              mousePosition.y * 0.005
            }px)`,
          }}
        />

        {/* Radial Gradient Overlays */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div
            className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
              transform: `translate(${mousePosition.x * 0.02}px, ${
                mousePosition.y * 0.02
              }px)`,
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute top-[20%] right-[-10%] w-[700px] h-[700px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, transparent 70%)",
              transform: `translate(${mousePosition.x * -0.015}px, ${
                mousePosition.y * -0.015
              }px)`,
              filter: "blur(70px)",
            }}
          />
          <div
            className="absolute bottom-[-15%] left-[30%] w-[500px] h-[500px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
              transform: `translate(${mousePosition.x * 0.01}px, ${
                mousePosition.y * 0.01
              }px)`,
              filter: "blur(80px)",
            }}
          />
        </div>

        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animation: `float ${particle.animationDuration}s ease-in-out ${particle.animationDelay}s infinite`,
              opacity: 0.2,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Professional Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor:
            scrollY > 50 ? "rgba(15, 23, 42, 0.8)" : "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(16px)",
          borderBottom:
            scrollY > 50
              ? "1px solid rgba(59, 130, 246, 0.2)"
              : "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-bold text-white">EventHub</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-200">
                Featured Event
              </span>
            </div>

            {/* Hero Image */}
            <div className="relative group overflow-hidden rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
              <img
                src={
                  event.imageUrl ||
                  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop"
                }
                alt={event.title}
                className="w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className="flex flex-wrap gap-2">
                  {[event.category].filter(Boolean).map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-white text-sm font-medium border border-white/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Title Section */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                {event.title}
              </h1>
              <p className="text-xl text-gray-400">
                Where technology meets innovation
              </p>
            </div>

            {/* Professional Tabs */}
            <div className="border-b border-white/10">
              <nav className="flex gap-1">
                {["Overview", "Gallery", "Announcements"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`relative px-6 py-3 font-medium text-sm transition-all rounded-t-lg ${
                      activeTab === tab.toLowerCase()
                        ? "text-white bg-white/5"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`}
                  >
                    {tab}
                    {activeTab === tab.toLowerCase() && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 to-purple-500"></span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Card */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 sm:p-6 md:p-8 border border-black/40 shadow-2xl">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Mobile Ticket Purchase Card - Only visible on mobile */}
                  <div className="lg:hidden backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 sm:p-4 border border-white/20 shadow-xl relative overflow-hidden mb-4">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>

                    <div className="relative z-10">
                      {/* Compact Price Section */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/20">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/30">
                            <span className="text-lg">🎫</span>
                          </div>
                          <div>
                            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                              ₹{(event.price || 499).toLocaleString("en-IN")}
                            </div>
                            <div className="text-xs text-gray-400">per ticket</div>
                          </div>
                        </div>
                        
                        {/* Compact Availability */}
                        <div className="text-right">
                          <div className="text-xs text-gray-400 mb-1">Availability</div>
                          <div className="text-sm font-bold text-white bg-white/10 px-2 py-1 rounded-lg">
                            {event._count?.bookings || 0}/{event.capacity || 1000}
                          </div>
                        </div>
                      </div>

                      {/* Compact Progress Bar */}
                      <div className="mb-3">
                        <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(5, bookedPercentage)
                              )}%`,
                            }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[10px] text-gray-400">
                            {Math.round(bookedPercentage)}% filled
                          </p>
                          <p className="text-[10px] text-green-400 font-medium">
                            {availableSpots > 0
                              ? `${availableSpots} spots left`
                              : "Sold Out"}
                          </p>
                        </div>
                      </div>

                      {/* CTA Button - Compact */}
                      {user ? (
                        hasEventEnded() ? (
                          <div className="w-full bg-gray-600 text-white py-2 px-4 rounded-xl font-bold text-sm text-center">
                            <div>Event Ended</div>
                          </div>
                        ) : hasEventStarted() ? (
                          <div className="w-full bg-orange-600 text-white py-2 px-4 rounded-xl font-bold text-sm text-center">
                            <div>Event Started</div>
                          </div>
                        ) : event.booking_closed ? (
                          <div className="w-full bg-red-600 text-white py-2 px-4 rounded-xl font-bold text-sm text-center">
                            <div>Booking Closed</div>
                          </div>
                        ) : userReachedLimit ? (
                          <div className="w-full bg-green-600 text-white py-2 px-4 rounded-xl font-bold text-sm text-center">
                            Booked
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowBookingModal(true)}
                            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-2.5 px-4 rounded-xl font-bold text-sm hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 relative overflow-hidden group"
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              <span>🚀</span>
                              Book Now
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          </button>
                        )
                      ) : (
                        <Link
                          href="/?login=true"
                          className="w-full inline-block text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-2.5 px-4 rounded-xl font-bold text-sm hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 relative overflow-hidden group"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <span>🔐</span>
                            Sign In to Book
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        </Link>
                      )}

                      {/* Compact Trust indicators */}
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400">
                          <div className="flex items-center gap-1">
                            <span className="text-green-400">🔒</span>
                            <span>Secure</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-blue-400">⚡</span>
                            <span>Instant</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-purple-400">📱</span>
                            <span>Mobile</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      About This Event
                    </h3>
                    <div
                      className="text-gray-300 leading-relaxed mb-4 break-words"
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: linkifyText(
                          event.description ||
                            "A premier gathering of tech leaders, innovators and entrepreneurs. Experience keynote speeches from industry giants, hands-on workshops, networking opportunities, and product launches."
                        ),
                      }}
                    />
                    <p className="text-gray-300 leading-relaxed font-bold">
                      🎤 Join us for a unique experience that brings people
                      together, inspires new energy, and creates unforgettable
                      moments—no matter the vibe.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-xl font-bold text-white mb-6">
                      What You'll Experience
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const highlights =
                          event.experienceHighlights ||
                          event.experience_highlights ||
                          event.experiencehighlights;
                        return Array.isArray(highlights) &&
                          highlights.length > 0
                          ? highlights
                          : [
                              {
                                icon: "🎤",
                                title: "Keynote Speeches",
                                desc: "Industry leaders sharing insights",
                              },
                              {
                                icon: "🛠️",
                                title: "Workshops",
                                desc: "Hands-on learning sessions",
                              },
                              {
                                icon: "🤝",
                                title: "Networking",
                                desc: "Connect with professionals",
                              },
                              {
                                icon: "🚀",
                                title: "Product Launches",
                                desc: "Latest tech innovations",
                              },
                            ];
                      })().map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/10 transition-all group"
                        >
                          <div className="text-3xl group-hover:scale-110 transition-transform">
                            {item.icon || ""}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white mb-1">
                              {item.title}
                            </div>
                            <div
                              className="text-sm text-gray-400 break-words overflow-wrap-anywhere"
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: linkifyText(item.desc || ""),
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "gallery" && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Event Gallery
                  </h3>
                  {event.gallery && event.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {event.gallery.map((media, i) => (
                        <div
                          key={media.id || i}
                          className="relative group overflow-hidden rounded-xl aspect-square border border-white/10 cursor-pointer"
                          onClick={() => setSelectedGalleryItem(media)}
                        >
                          {media.type === "video" ? (
                            <video
                              src={media.url}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              muted
                            />
                          ) : (
                            <img
                              src={media.url}
                              alt={media.name || `Gallery ${i + 1}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          )}

                          {/* Video indicator - always visible for videos */}
                          {media.type === "video" && (
                            <>
                              {/* Video badge in top-left corner */}
                              <div className="absolute top-2 left-2 z-20 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                                <span>🎬</span>
                                VIDEO
                              </div>

                              {/* Play button for videos - shows on hover */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                                  <span className="text-black text-xl ml-1">
                                    ▶
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Image indicator for images */}
                          {media.type === "image" && (
                            <div className="absolute top-2 left-2 z-20 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>📷</span>
                              IMAGE
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">📸</div>
                      <h4 className="text-xl font-semibold text-white mb-2">
                        No Gallery Available
                      </h4>
                      <p className="text-gray-400">
                        Event gallery will be updated soon with photos and
                        videos.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  <EventReviews eventId={event.id} />
                </div>
              )}

              {activeTab === "announcements" && (
                <div>
                  <div className="text-center mb-6 md:mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 mb-4 md:mb-6">
                      <span className="text-3xl md:text-5xl">📢</span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold text-white mb-2 px-4">
                      Event Announcements
                    </h3>
                    <p className="text-sm md:text-base text-gray-400 px-4">
                      {canViewAnnouncements
                        ? "Important updates from the organizer"
                        : "Purchase a ticket to view announcements"}
                    </p>
                  </div>

                  {/* Admin Notice - Direct to Admin Dashboard */}
                  {isEventAdmin && (
                    <div className="mb-6 md:mb-8 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-indigo-600/5 border border-purple-500/20 shadow-lg backdrop-blur-sm">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-5 h-5 md:w-6 md:h-6 text-white"
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base md:text-lg font-bold text-white mb-2">
                            Event Administrator
                          </h4>
                          <p className="text-xs md:text-sm text-gray-300 mb-4">
                            To post announcements and manage this event, please
                            use the Admin Dashboard.
                          </p>
                          <Link
                            href="/admin/events"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-base font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                          >
                            <svg
                              className="w-4 h-4 md:w-5 md:h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>Go to Admin Dashboard</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Announcements List */}
                  {canViewAnnouncements ? (
                    announcements && announcements.length > 0 ? (
                      <div className="space-y-4 md:space-y-6">
                        {announcements.map((announcement, index) => (
                          <div
                            key={announcement.id || index}
                            className="group relative"
                          >
                            {/* Message Card */}
                            <div className="relative p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-white/10 shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
                                <div className="flex items-start md:items-center gap-2 md:gap-3 flex-1 min-w-0">
                                  {/* Icon */}
                                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                                    <span className="text-base md:text-xl">
                                      📢
                                    </span>
                                  </div>

                                  {/* Timestamp */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs md:text-sm font-semibold text-white">
                                      Event Organizer
                                    </div>
                                    <div className="text-[10px] md:text-xs text-gray-400 flex items-center gap-1">
                                      <svg
                                        className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <span className="truncate">
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
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Delete Button */}
                                {isEventAdmin && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Delete this announcement?"))
                                        return;
                                      try {
                                        const res = await fetch(
                                          `/api/events/${event.id}/announcements?announcementId=${announcement.id}&userId=${user.uid}`,
                                          { method: "DELETE" }
                                        );
                                        const data = await res.json();
                                        if (data.success) {
                                          setAnnouncements(data.announcements);
                                        }
                                      } catch (err) {
                                        console.error(
                                          "Error deleting announcement:",
                                          err
                                        );
                                      }
                                    }}
                                    className="md:opacity-0 md:group-hover:opacity-100 transition-opacity px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs md:text-sm font-medium border border-red-500/20 hover:border-red-500/40 flex items-center gap-1 md:gap-1.5 flex-shrink-0"
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
                                    <span className="hidden md:inline">
                                      Delete
                                    </span>
                                  </button>
                                )}
                              </div>

                              {/* Message Content */}
                              <div className="md:pl-13">
                                <div className="relative">
                                  {/* Message Text */}
                                  <p className="text-white/90 leading-relaxed whitespace-pre-wrap text-sm md:text-[15px] font-normal break-words">
                                    {announcement.message}
                                  </p>

                                  {/* Decorative gradient line - hidden on mobile */}
                                  <div className="hidden md:block absolute -left-13 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-transparent opacity-50"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 md:py-12 px-4">
                        <div className="text-4xl md:text-5xl mb-3 md:mb-4">
                          📭
                        </div>
                        <h4 className="text-lg md:text-xl font-semibold text-white mb-2">
                          No Announcements Yet
                        </h4>
                        <p className="text-sm md:text-base text-gray-400">
                          The organizer hasn't posted any announcements.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 md:py-12 px-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-600/20 border-2 border-yellow-500/30 mb-4 md:mb-6">
                        <span className="text-3xl md:text-4xl">🔒</span>
                      </div>
                      <h4 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">
                        Announcements Locked
                      </h4>
                      <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto">
                        Purchase a ticket to view event announcements and
                        important updates from the organizer.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div
            className={`lg:col-span-1 space-y-6 ${
              activeTab === "gallery" || activeTab === "announcements"
                ? "hidden lg:block"
                : ""
            }`}
          >
            {/* Pricing Card */}
            <div className="hidden lg:block sticky top-28 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-4 sm:p-6 md:p-8 border border-white/20 shadow-2xl relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>

              <div className="relative z-10">
                <div className="text-center mb-8 pb-6 border-b border-white/20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/30 mb-4">
                    <span className="text-3xl">🎫</span>
                  </div>
                  <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    ₹{(event.price || 499).toLocaleString("en-IN")}
                  </div>
                  <div className="text-sm text-gray-300 font-medium">
                    per ticket
                  </div>
                </div>

                {/* Availability Progress */}
                <div className="mb-8">
                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className="text-gray-300 font-medium">
                      Availability
                    </span>
                    <span className="font-bold text-white bg-white/10 px-3 py-1 rounded-full">
                      {event._count?.bookings || 0} / {event.capacity || 1000}
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 shadow-lg"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, bookedPercentage)
                        )}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-gray-400">
                      {Math.round(bookedPercentage)}% filled
                    </p>
                    <p className="text-xs text-green-400 font-medium">
                      {availableSpots > 0
                        ? `${availableSpots} spots left`
                        : "Sold Out"}
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                {user ? (
                  hasEventEnded() ? (
                    <div className="w-full bg-gray-600 text-white py-3 px-6 rounded-2xl font-bold text-base sm:text-lg text-center">
                      <div>Event Ended</div>
                      <div className="text-xs sm:text-sm font-normal mt-1">
                        This event has concluded
                      </div>
                    </div>
                  ) : hasEventStarted() ? (
                    <div className="w-full bg-orange-600 text-white py-3 px-6 rounded-2xl font-bold text-base sm:text-lg text-center">
                      <div>Event Started</div>
                      <div className="text-xs sm:text-sm font-normal mt-1">
                        Registration Closed
                      </div>
                    </div>
                  ) : event.booking_closed ? (
                    <div className="w-full bg-red-600 text-white py-3 px-6 rounded-2xl font-bold text-base sm:text-lg text-center">
                      <div>Booking Closed</div>
                      <div className="text-xs sm:text-sm font-normal mt-1">
                        By Organizer
                      </div>
                    </div>
                  ) : userReachedLimit ? (
                    <>
                      <div className="w-full bg-green-600 text-white py-3 px-6 rounded-2xl font-bold text-base sm:text-lg text-center">
                        Booked
                      </div>
                      {hasBookingLimit && event.max_tickets_per_user === 1 && (
                        <div className="mt-2 text-xs text-gray-300 text-center">
                          1 user can book only 1 ticket
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3 px-6 rounded-2xl font-bold text-base sm:text-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:shadow-2xl hover:scale-[1.02] transform relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <span>🚀</span>
                        Book Now
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                  )
                ) : (
                  <Link
                    href="/?login=true"
                    className="w-full inline-block text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3 px-6 rounded-2xl font-bold text-base sm:text-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:shadow-2xl hover:scale-[1.02] transform relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>🔐</span>
                      Sign In to Book
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  </Link>
                )}

                {/* Trust indicators */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="text-green-400">🔒</span>
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-400">⚡</span>
                      <span>Instant Booking</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-purple-400">📱</span>
                      <span>Mobile Tickets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details Card */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-black/40 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">
                Event Details
              </h3>
              <div className="space-y-5">
                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-xl sm:text-2xl">
                    📅
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      Date & Time
                    </div>
                    <div className="text-sm text-gray-300">
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
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          timeZone: "Asia/Kolkata",
                        });
                      })()}
                    </div>
                    <div className="text-sm text-gray-400">
                      {(() => {
                        if (event.time) {
                          // If time is already formatted with AM/PM, use it directly
                          if (
                            event.time.includes("AM") ||
                            event.time.includes("PM")
                          ) {
                            return event.time;
                          }
                          // If time is in 24-hour format (HH:MM), convert to 12-hour with AM/PM
                          const timeParts = event.time.split(":");
                          if (timeParts.length === 2) {
                            let hours = parseInt(timeParts[0]);
                            const minutes = timeParts[1];
                            const ampm = hours >= 12 ? "PM" : "AM";
                            hours = hours % 12;
                            hours = hours ? hours : 12; // 0 should be 12
                            return `${hours}:${minutes} ${ampm}`;
                          }
                        }
                        return "09:00 AM";
                      })()}
                    </div>
                  </div>
                </div>

                {(event.endDate ||
                  event.enddate ||
                  event.endTime ||
                  event.endtime) && (
                  <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-600/20 flex items-center justify-center text-xl sm:text-2xl">
                      🏁
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">
                        Ending Date & Time
                      </div>
                      <div className="text-sm text-gray-300">
                        {event.endDate || event.enddate
                          ? (() => {
                              // Ensure proper UTC parsing for database dates
                              const endDateValue =
                                event.endDate || event.enddate;
                              const dateStr =
                                endDateValue.includes("T") &&
                                endDateValue.includes("Z")
                                  ? endDateValue
                                  : endDateValue.includes("T")
                                  ? endDateValue + "Z"
                                  : endDateValue.replace(" ", "T") + "Z";

                              const endDate = new Date(dateStr);

                              // Convert to IST and display
                              return endDate.toLocaleDateString("en-IN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                timeZone: "Asia/Kolkata",
                              });
                            })()
                          : "End date not specified"}
                      </div>
                      <div className="text-sm text-gray-400">
                        {(() => {
                          const endTime = event.endTime || event.endtime;

                          if (endTime) {
                            // If time is already formatted with AM/PM, use it directly
                            if (
                              endTime.includes("AM") ||
                              endTime.includes("PM")
                            ) {
                              return endTime;
                            }
                            // If time is in 24-hour format (HH:MM or HH:MM:SS), convert to 12-hour with AM/PM
                            const timeParts = endTime.split(":");
                            if (timeParts.length >= 2) {
                              let hours = parseInt(timeParts[0]);
                              const minutes = timeParts[1];
                              const ampm = hours >= 12 ? "PM" : "AM";
                              hours = hours % 12;
                              hours = hours ? hours : 12; // 0 should be 12
                              return `${hours}:${minutes} ${ampm}`;
                            }
                          }
                          // Show "Not specified" if no ending time is set
                          return "End time not specified";
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-600/20 flex items-center justify-center text-xl sm:text-2xl">
                    📍
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      Location
                    </div>
                    <div className="text-sm text-gray-400">
                      {event.location || "Convention Center, San Francisco"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-xl sm:text-2xl">
                    👥
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                      Availability
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">
                        {(event.capacity || 1000) - availableSpots}/
                        {event.capacity || 1000} registered
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          availableSpots > 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {availableSpots > 0
                          ? `${availableSpots} spots remaining`
                          : "Sold Out"}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <div>
                        {event.date
                          ? new Date(event.date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              timeZone: "Asia/Kolkata",
                            })
                          : "Date TBD"}
                        {event.time ? ` • ${event.time}` : ""}
                        {event.endTime || event.endtime
                          ? ` - ${event.endTime || event.endtime}`
                          : ""}
                      </div>
                      <div>{event.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organizer Card */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 sm:p-6 border border-black/40 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Organizer</h3>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <span className="text-white font-bold text-xl">
                    {event.organizer?.name?.charAt(0).toUpperCase() || "T"}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-white text-lg">
                    {event.organizerName ||
                      event.organizer?.name ||
                      "TechCon Global"}
                  </div>
                  <div className="text-sm text-gray-400">Event Organizer</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-300 p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-lg">📧</span>
                  <span>
                    {event.organizerEmail ||
                      event.organizer?.email ||
                      "contact@techcon.com"}
                  </span>
                </div>
                {(event.organizerPhone || event.organizer?.phone) && (
                  <div className="flex items-center gap-3 text-sm text-gray-300 p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-lg">📞</span>
                    <span>
                      {event.organizerPhone ||
                        event.organizer?.phone ||
                        "+1 (555) 987-6543"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Popup */}
      {selectedGalleryItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedGalleryItem(null)}
        >
          <div
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedGalleryItem(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-red-400 transition-colors"
            >
              ✕
            </button>
            {selectedGalleryItem.type === "video" ? (
              <video
                src={selectedGalleryItem.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            ) : (
              <img
                src={selectedGalleryItem.url}
                alt={selectedGalleryItem.name}
                className="max-w-full max-h-[80vh] rounded-lg object-contain"
              />
            )}
            <div className="mt-4 text-center">
              <p className="text-white text-sm opacity-80">
                {selectedGalleryItem.name ||
                  `Gallery ${selectedGalleryItem.type}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Purchase Button - Mobile Only */}
      {!showBookingModal && (
        <div className="fixed top-20 right-4 z-50 lg:hidden">
          {user ? (
            !hasEventStarted && !event.booking_closed && !userReachedLimit ? (
              <button
                onClick={() => setShowBookingModal(true)}
                className="group relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white w-12 h-12 rounded-full font-bold shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center animate-pulse hover:animate-none"
                aria-label="Buy Ticket"
              >
                <span className="text-xl relative z-10">🎫</span>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>

                {/* Ripple effect */}
                <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></span>
              </button>
            ) : null
          ) : (
            <Link
              href="/?login=true"
              className="group relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white w-12 h-12 rounded-full font-bold shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center animate-pulse hover:animate-none"
              aria-label="Sign In"
            >
              <span className="text-xl relative z-10">🔐</span>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>

              {/* Ripple effect */}
              <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></span>
            </Link>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        event={event}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </div>
  );
}
