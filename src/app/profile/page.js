"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TicketModal from "@/components/TicketModal";
import EventHubLogo from "@/components/EventHubLogo";

export default function ProfilePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
  });
  const [redirectCountdown, setRedirectCountdown] = useState(5);


  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate particles on client side only to avoid hydration issues
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [...Array(40)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 2,
        animationDuration: 2 + Math.random() * 3,
      }));
      setParticles(newParticles);
    };

    generateParticles();
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

  // Fetch user's bookings when user is available
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching bookings for user:", user.uid);

        const cacheBuster = Date.now();
        const response = await fetch(
          `/api/bookings?userId=${user.uid}&_=${cacheBuster}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          setBookings([]);
          return;
        }

        if (response.ok) {
          const allBookings = data.bookings || [];
          setBookings(allBookings);

          // Calculate statistics
          const now = new Date(); // Current time in UTC

          // Helper to parse UTC dates
          const parseEventDate = (dateStr) => {
            if (!dateStr) return null;
            if (dateStr.includes("T") && dateStr.includes("Z")) {
              return new Date(dateStr);
            } else if (dateStr.includes("T")) {
              return new Date(dateStr + "Z");
            } else {
              return new Date(dateStr.replace(" ", "T") + "Z");
            }
          };

          const stats = {
            total: allBookings.length,
            upcoming: allBookings.filter((booking) => {
              const eventDate = parseEventDate(booking.event?.date);
              return (
                eventDate && eventDate >= now && booking.status === "CONFIRMED"
              );
            }).length,
            completed: allBookings.filter((booking) => {
              const eventDate = parseEventDate(booking.event?.date);
              return (
                eventDate && eventDate < now && booking.status === "CONFIRMED"
              );
            }).length,
          };
          setBookingStats(stats);
        } else {
          console.error("Failed to fetch bookings:", data);
          setBookings([]);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);
  const openTicketModal = (booking) => {
    setSelectedTicket(booking);
    setShowTicketModal(true);
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return "Date TBD";

    // Parse UTC date from database
    let date;
    if (dateString.includes("T") && dateString.includes("Z")) {
      date = new Date(dateString);
    } else if (dateString.includes("T")) {
      date = new Date(dateString + "Z");
    } else {
      date = new Date(dateString.replace(" ", "T") + "Z");
    }

    if (!date || isNaN(date.getTime())) {
      return "Date TBD";
    }

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  const getEventStatus = (booking) => {
    if (booking.status !== "CONFIRMED") {
      return { text: booking.status, className: "text-yellow-400" };
    }

    // Parse UTC date from database
    const dateStr = booking.event?.date;
    if (!dateStr) {
      return { text: "Unknown", className: "text-gray-400" };
    }

    let eventDate;
    if (dateStr.includes("T") && dateStr.includes("Z")) {
      eventDate = new Date(dateStr);
    } else if (dateStr.includes("T")) {
      eventDate = new Date(dateStr + "Z");
    } else {
      eventDate = new Date(dateStr.replace(" ", "T") + "Z");
    }

    if (!eventDate || isNaN(eventDate.getTime())) {
      return { text: "Unknown", className: "text-gray-400" };
    }

    const now = new Date(); // Current time in UTC

    if (eventDate >= now) {
      return { text: "Upcoming", className: "text-green-400" };
    } else {
      return { text: "Completed", className: "text-gray-400" };
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "overview") return true;

    // Parse UTC date from database
    const dateStr = booking.event?.date;
    if (!dateStr) return false;

    let eventDate;
    if (dateStr.includes("T") && dateStr.includes("Z")) {
      eventDate = new Date(dateStr);
    } else if (dateStr.includes("T")) {
      eventDate = new Date(dateStr + "Z");
    } else {
      eventDate = new Date(dateStr.replace(" ", "T") + "Z");
    }

    if (!eventDate || isNaN(eventDate.getTime())) return false;

    const now = new Date(); // Current time in UTC

    if (activeTab === "upcoming") {
      return eventDate >= now && booking.status === "CONFIRMED";
    }
    if (activeTab === "completed") {
      return eventDate < now && booking.status === "CONFIRMED";
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.animationDelay}s`,
                animationDuration: `${particle.animationDuration}s`,
              }}
            />
          ))}
        </div>

        <div className="text-center text-white relative z-10 p-8 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 max-w-md mx-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <EventHubLogo size={64} showText={false} />
          </div>

          {/* Lock Icon */}
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-4 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Authentication Required
          </h1>
          <p className="text-white/70 mb-2 text-lg">
            You need to be signed in to view your profile.
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
              className="block w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 font-medium shadow-lg"
            >
              Go to Home & Sign In
            </Link>
            <button
              onClick={() => router.back()}
              className="block w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors border border-white/20"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
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
          className="absolute w-96 h-96 bg-linear-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/">
              <EventHubLogo size={32} showText={true} />
            </Link>

            {/* Back to Home */}
            <Link
              href="/"
              className="text-white/80 hover:text-white transition-colors flex items-center space-x-2"
            >
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {(user.displayName ||
                    user.email?.split("@")[0] ||
                    "U")[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.displayName || user.email?.split("@")[0] || "User"}
              </h1>
              <p className="text-white/70 mb-4">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2">
              <Link
                href="/contact"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
              >
                Contact Support
              </Link>
              <button
                onClick={async () => {
                  try {
                    await signOut();
                    window.location.href = "/";
                  } catch (error) {
                    console.error("Error signing out:", error);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 mb-8">
          <div className="flex space-x-1 p-1">
            {[
              { id: "overview", label: "Overview", shortLabel: "Overview" },
              {
                id: "upcoming",
                label: "Upcoming Events",
                shortLabel: "Upcoming",
              },
              { id: "completed", label: "Event History", shortLabel: "History" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/70 mt-4">Loading your bookings...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Account Overview
                  </h2>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                      <h3 className="text-blue-400 font-semibold mb-2 text-sm">
                        Account Status
                      </h3>
                      <p className="text-white text-sm">Active Member</p>
                      <p className="text-white/60 text-xs">
                        Member since{" "}
                        {new Date(
                          user.metadata?.creationTime || Date.now()
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                      <h3 className="text-green-400 font-semibold mb-2 text-sm">
                        Total Events
                      </h3>
                      <p className="text-white text-xl font-bold">
                        {bookingStats.total}
                      </p>
                      <p className="text-white/60 text-xs">Events attended</p>
                    </div>

                    <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                      <h3 className="text-yellow-400 font-semibold mb-2 text-sm">
                        Upcoming
                      </h3>
                      <p className="text-white text-xl font-bold">
                        {bookingStats.upcoming}
                      </p>
                      <p className="text-white/60 text-xs">Events coming</p>
                    </div>

                    <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-lg p-4">
                      <h3 className="text-emerald-400 font-semibold mb-2 text-sm">
                        Completed
                      </h3>
                      <p className="text-white text-xl font-bold">
                        {bookingStats.completed}
                      </p>
                      <p className="text-white/60 text-xs">Events finished</p>
                    </div>

                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                      <h3 className="text-purple-400 font-semibold mb-2 text-sm">
                        User Role
                      </h3>
                      <p className="text-white text-sm">
                        {user.role || "Event Attendee"}
                      </p>
                      <p className="text-white/60 text-xs">Account type</p>
                    </div>
                  </div>


                  {/* Recent Activity */}
                  <h3 className="text-xl font-bold text-white mb-4">
                    Recent Activity
                  </h3>
                  {filteredBookings.slice(0, 3).length > 0 ? (
                    <div className="space-y-3">
                      {filteredBookings.slice(0, 3).map((booking) => {
                        // Get event image for recent activity
                        const getEventImage = () => {
                          if (booking.event?.imageUrl) {
                            return booking.event.imageUrl;
                          }

                          const categoryImages = {
                            Music:
                              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Technology:
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            "Food & Drink":
                              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            "Art & Culture":
                              "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Business:
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            "Health & Wellness":
                              "https://images.unsplash.com/photo-1506629905607-45c9e2dd4e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Gaming:
                              "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Education:
                              "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Entertainment:
                              "https://images.unsplash.com/photo-1574391884720-bbc9d0bca4f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                          };

                          return (
                            categoryImages[booking.event?.category] ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                          );
                        };

                        return (
                          <div
                            key={booking.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              {/* Event Thumbnail */}
                              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={getEventImage()}
                                  alt={booking.event?.title || "Event"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
                                  }}
                                />
                              </div>

                              {/* Event Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold truncate">
                                  {booking.event?.title || "Event"}
                                </h4>
                                <p className="text-white/60 text-sm">
                                  {formatEventDate(booking.event?.date)}
                                </p>
                                {booking.event?.category && (
                                  <p className="text-blue-400 text-xs">
                                    {booking.event.category}
                                  </p>
                                )}
                              </div>

                              {/* Status Badge */}
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  getEventStatus(booking).className
                                } bg-current/20 border border-current/30 shrink-0`}
                              >
                                {getEventStatus(booking).text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-white/60">No recent activity</p>
                  )}
                </div>
              )}

              {(activeTab === "upcoming" || activeTab === "completed") && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    {activeTab === "upcoming"
                      ? "Upcoming Events"
                      : "Event History"}
                  </h2>

                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-white/40"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-white font-semibold mb-2">
                        No {activeTab} events
                      </h3>
                      <p className="text-white/60 mb-4">
                        {activeTab === "upcoming"
                          ? "You don't have any upcoming events. Explore events to book your next adventure!"
                          : "You haven't attended any events yet. Start exploring!"}
                      </p>
                      <Link
                        href="/events"
                        className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        <span>Explore Events</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m-4-4H3"
                          />
                        </svg>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {filteredBookings.map((booking) => {
                        const eventStatus = getEventStatus(booking);
                        const isCompleted = eventStatus.text === "Completed";

                        // Get event image - use event's imageUrl or fallback to category-based image
                        const getEventImage = () => {
                          if (booking.event?.imageUrl) {
                            return booking.event.imageUrl;
                          }

                          // Fallback images based on category
                          const categoryImages = {
                            Music:
                              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Technology:
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            "Food & Drink":
                              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            "Art & Culture":
                              "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Business:
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            "Health & Wellness":
                              "https://images.unsplash.com/photo-1506629905607-45c9e2dd4e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Gaming:
                              "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Education:
                              "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Entertainment:
                              "https://images.unsplash.com/photo-1574391884720-bbc9d0bca4f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                          };

                          return (
                            categoryImages[booking.event?.category] ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                          );
                        };

                        return (
                          <div
                            key={booking.id}
                            className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
                          >
                            <div className="flex flex-col lg:flex-row">
                              {/* Event Image */}
                              <div className="lg:w-80 h-48 lg:h-auto relative">
                                <img
                                  src={getEventImage()}
                                  alt={booking.event?.title || "Event"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                                  }}
                                />

                                {/* Event Status Badge */}
                                <div className="absolute top-3 right-3">
                                  <span
                                    className={`text-xs font-medium px-3 py-1 rounded-full ${eventStatus.className} bg-current/20 backdrop-blur-sm border border-current/30`}
                                  >
                                    {eventStatus.text}
                                  </span>
                                </div>

                                {/* Completed Stamp for Event History */}
                                {isCompleted && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-green-600/90 backdrop-blur-sm border-2 border-green-400 rounded-full p-4 transform rotate-12 shadow-lg">
                                      <div className="flex flex-col items-center text-white">
                                        <svg
                                          className="w-8 h-8 mb-1"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                        </svg>
                                        <span className="text-xs font-bold">
                                          COMPLETED
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Event Info */}
                              <div className="flex-1 p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between h-full">
                                  <div className="flex-1 mb-4 lg:mb-0">
                                    <h3 className="text-xl font-bold text-white mb-3">
                                      {booking.event?.title || "Event"}
                                    </h3>

                                    <div className="space-y-3 text-white/70">
                                      <div className="flex items-center space-x-2">
                                        <svg
                                          className="w-4 h-4 shrink-0"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                                          />
                                        </svg>
                                        <span className="text-sm">
                                          {formatEventDate(booking.event?.date)}
                                        </span>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <svg
                                          className="w-4 h-4 shrink-0"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                        </svg>
                                        <span className="text-sm">
                                          {booking.event?.location ||
                                            "Location TBA"}
                                        </span>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <svg
                                          className="w-4 h-4 shrink-0"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                          />
                                        </svg>
                                        <span className="text-sm">
                                          {booking.tickets} ticket
                                          {booking.tickets > 1 ? "s" : ""}
                                        </span>
                                      </div>

                                      {booking.event?.category && (
                                        <div className="flex items-center space-x-2">
                                          <svg
                                            className="w-4 h-4 shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                            />
                                          </svg>
                                          <span className="text-sm text-blue-400">
                                            {booking.event.category}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 lg:ml-6">
                                    {!isCompleted ? (
                                      // For upcoming events - show View Ticket and Event Details buttons
                                      <>
                                        <button
                                          onClick={() =>
                                            openTicketModal(booking)
                                          }
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                          </svg>
                                          <span>View Ticket</span>
                                        </button>

                                        <Link
                                          href={`/events/${booking.eventId}`}
                                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                        >
                                          <svg
                                            className="w-4 h-4"
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
                                          <span>Event Details</span>
                                        </Link>
                                      </>
                                    ) : (
                                      // For completed events - show only completed stamp
                                      <div className="bg-green-600/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg flex items-center justify-center space-x-2">
                                        <svg
                                          className="w-4 h-4"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                        </svg>
                                        <span className="font-medium text-sm">
                                          Event Completed
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <TicketModal
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setSelectedTicket(null);
          }}
          booking={selectedTicket}
        />
      )}
    </div>
  );
}
