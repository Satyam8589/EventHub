"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import TicketModal from "@/components/TicketModal";

export default function MyEventsPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const { user, loading: authLoading, signOut } = useAuth();

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

  // Fetch user's bookings when user is available
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/bookings?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setBookings(data.bookings || []);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchBookings();
    }
  }, [user, authLoading]);

  // Filter bookings by upcoming/past
  const filterBookings = (bookings, type) => {
    const now = new Date();
    return bookings.filter((booking) => {
      const eventDate = new Date(booking.event.date);
      return type === "upcoming" ? eventDate >= now : eventDate < now;
    });
  };

  const upcomingBookings = filterBookings(bookings, "upcoming");
  const pastBookings = filterBookings(bookings, "past");

  // Format date for display
  const formatEventDate = (dateString, timeString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return `${date.toLocaleDateString("en-US", options)} at ${timeString}`;
  };

  // If user is not logged in, show login prompt
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
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
            className="absolute w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
            style={{
              transform: `translate(${mousePosition.x * 0.02}px, ${
                mousePosition.y * 0.02
              }px)`,
            }}
          />
          <div
            className="absolute w-96 h-96 bg-gradient-to-r from-yellow-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 top-20 right-20"
            style={{
              transform: `translate(${mousePosition.x * -0.01}px, ${
                mousePosition.y * -0.01
              }px)`,
            }}
          />
          <div
            className="absolute w-96 h-96 bg-gradient-to-r from-green-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 bottom-20 left-20"
            style={{
              transform: `translate(${mousePosition.x * 0.015}px, ${
                mousePosition.y * 0.015
              }px)`,
            }}
          />
        </div>

        {/* Navigation */}
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
                <Link
                  href="/"
                  className="text-white/80 hover:text-white transition-colors font-medium"
                >
                  ← Back to Home
                </Link>
                
                {/* Desktop Sign Out Icon - Always visible when logged in */}
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Login Required Content */}
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">
                Login to View Your Tickets
              </h1>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Sign in to access your booked events, manage your tickets, and
                view your event history.
              </p>

              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
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
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign In to Continue
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
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
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        />
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-yellow-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 top-20 right-20"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${
              mousePosition.y * -0.01
            }px)`,
          }}
        />
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-green-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 bottom-20 left-20"
          style={{
            transform: `translate(${mousePosition.x * 0.015}px, ${
              mousePosition.y * 0.015
            }px)`,
          }}
        />
      </div>

      {/* Navigation */}
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
              {!authLoading &&
                user &&
                (user.role === "SUPER_ADMIN" ||
                  user.role === "EVENT_ADMIN") && (
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
            </div>
          </div>
        </div>
      </nav>

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
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "past"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Past Events ({pastBookings.length})
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
            {(activeTab === "upcoming" ? upcomingBookings : pastBookings)
              .length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20 max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                    <svg
                      className="w-10 h-10 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    No {activeTab} events
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {activeTab === "upcoming"
                      ? "You haven't booked any upcoming events yet. Discover amazing events happening near you!"
                      : "You don't have any past events yet. Your attended events will appear here."}
                  </p>
                  {activeTab === "upcoming" && (
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Browse Events
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              (activeTab === "upcoming" ? upcomingBookings : pastBookings).map(
                (booking) => (
                  <div
                    key={booking.id}
                    className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-200 group"
                  >
                    {/* Event Image */}
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={
                          booking.event.imageUrl || "/api/placeholder/400/200"
                        }
                        alt={booking.event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            activeTab === "upcoming"
                              ? "bg-green-500/80 text-white"
                              : "bg-gray-500/80 text-white"
                          }`}
                        >
                          {activeTab === "upcoming" ? "Upcoming" : "Attended"}
                        </span>
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
                            {formatEventDate(
                              booking.event.date,
                              booking.event.time
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                          <span className="text-purple-400">📍</span>
                          <span className="text-xs line-clamp-1">
                            {booking.event.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            console.log("View Ticket clicked:", booking);
                            setSelectedTicket(booking);
                            setShowTicketModal(true);
                          }}
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
                  </div>
                )
              )
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
