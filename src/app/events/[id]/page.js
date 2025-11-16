"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import BookingModal from "@/components/BookingModal";

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
  const [attendees, setAttendees] = useState([]);
  const [totalAttendees, setTotalAttendees] = useState(0);

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

  // Fetch attendees separately
  useEffect(() => {
    if (!p?.id) return;

    console.log(">>> Fetching attendees for event ID:", p.id);

    fetch(`/api/events/${p.id}/attendees`)
      .then((res) => {
        console.log(">>> Attendees fetch response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log(">>> Attendees API response:", data);
        console.log(">>> Setting attendees:", data.attendees);
        console.log(">>> Setting total:", data.total);
        setAttendees(data.attendees || []);
        setTotalAttendees(data.total || 0);
      })
      .catch((err) => {
        console.error(">>> Error fetching attendees:", err);
      });
  }, [p?.id]);

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
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-16">
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
                  {[
                    event.category || "Technology",
                    "Conference",
                    "Networking",
                  ].map((tag, i) => (
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
                {["Overview", "Gallery", "Attendees"].map((tab) => (
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
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-black/40 shadow-2xl">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      About This Event
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      {event.description ||
                        "A premier gathering of tech leaders, innovators and entrepreneurs. Experience keynote speeches from industry giants, hands-on workshops, networking opportunities, and product launches."}
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                      Join us for an unforgettable experience where cutting-edge
                      technology meets practical innovation.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-xl font-bold text-white mb-6">
                      What You'll Experience
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
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
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/10 transition-all group"
                        >
                          <div className="text-3xl group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-white mb-1">
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-400">
                              {item.desc}
                            </div>
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

              {activeTab === "attendees" && (
                <div>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 mb-6">
                      <span className="text-5xl">👥</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {totalAttendees} Attendees
                    </h3>
                    <p className="text-gray-400">Registered for this event</p>
                  </div>

                  {/* Top 5 Attendees */}
                  {attendees && attendees.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-xl font-bold text-white mb-6">
                        Latest Registrations
                      </h4>
                      <div className="space-y-3">
                        {attendees.map((attendee, index) => {
                          // Generate color based on index
                          const colors = [
                            "from-blue-600 to-blue-400",
                            "from-purple-600 to-purple-400",
                            "from-pink-600 to-pink-400",
                            "from-green-600 to-green-400",
                            "from-orange-600 to-orange-400",
                          ];
                          const color = colors[index % colors.length];

                          // Get initials from name
                          const getInitials = (name) => {
                            if (!name) return "?";
                            const parts = name.trim().split(" ");
                            if (parts.length >= 2) {
                              return (
                                parts[0][0] + parts[parts.length - 1][0]
                              ).toUpperCase();
                            }
                            return name.substring(0, 2).toUpperCase();
                          };

                          return (
                            <div
                              key={attendee.userId || index}
                              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/10 transition-all"
                            >
                              {/* Avatar */}
                              <div
                                className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shadow-lg`}
                              >
                                {getInitials(attendee.name)}
                              </div>

                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white truncate">
                                  {attendee.name}
                                </div>
                              </div>

                              {/* Badge */}
                              <div className="flex-shrink-0">
                                <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs font-medium border border-blue-500/30">
                                  #{index + 1}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Show remaining count if more than 5 */}
                      {totalAttendees > 5 && (
                        <div className="mt-6 text-center">
                          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-gray-300">
                              +{totalAttendees - 5} more attendees
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No attendees message */}
                  {(!attendees || attendees.length === 0) &&
                    totalAttendees === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">
                          No attendees registered yet. Be the first to book!
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing Card */}
            <div className="sticky top-28 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden">
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
                      {availableSpots} / {event.capacity || 1000}
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
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:shadow-2xl hover:scale-[1.02] transform relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>🚀</span>
                      Book Now
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="w-full inline-block text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:shadow-2xl hover:scale-[1.02] transform relative overflow-hidden group"
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
                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-2xl">
                    📅
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      Date & Time
                    </div>
                    <div className="text-sm text-gray-300">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
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
                  <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center text-2xl">
                      🏁
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">
                        Ending Date & Time
                      </div>
                      <div className="text-sm text-gray-300">
                        {event.endDate || event.enddate
                          ? new Date(
                              event.endDate || event.enddate
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "End date not specified"}
                      </div>
                      <div className="text-sm text-gray-400">
                        {(() => {
                          const endTime = event.endTime || event.endtime;
                          console.log("🔍 DEBUG Ending Time:", {
                            endTime,
                            "event.endTime": event.endTime,
                            "event.endtime": event.endtime,
                            type: typeof endTime,
                          });

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

                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center text-2xl">
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

                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-2xl">
                    👥
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      Capacity
                    </div>
                    <div className="text-sm text-gray-300">
                      {(event.capacity || 1000) - availableSpots} registered
                    </div>
                    <div className="text-sm text-gray-400">
                      {availableSpots} spots remaining
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organizer Card */}
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-black/40 shadow-2xl">
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

      {/* Mobile Attendees Section - Compact at Bottom */}
      <div className="md:hidden bg-linear-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">👥 Attendees</h3>
            <span className="text-sm text-gray-300 bg-white/10 px-3 py-1 rounded-full">
              {totalAttendees}
            </span>
          </div>

          {/* Compact Attendees List */}
          {attendees && attendees.length > 0 ? (
            <div className="space-y-2">
              {/* Top 5 in compact horizontal scroll */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {attendees.slice(0, 5).map((attendee, index) => {
                  const colors = [
                    "from-blue-600 to-blue-400",
                    "from-purple-600 to-purple-400",
                    "from-pink-600 to-pink-400",
                    "from-green-600 to-green-400",
                    "from-orange-600 to-orange-400",
                  ];
                  const color = colors[index % colors.length];

                  const getInitials = (name) => {
                    if (!name) return "?";
                    const parts = name.trim().split(" ");
                    if (parts.length >= 2) {
                      return (
                        parts[0][0] + parts[parts.length - 1][0]
                      ).toUpperCase();
                    }
                    return name.substring(0, 2).toUpperCase();
                  };

                  return (
                    <div
                      key={attendee.userId || index}
                      className="shrink-0 text-center"
                    >
                      <div
                        className={`w-12 h-12 rounded-full bg-linear-to-br ${color} flex items-center justify-center text-white text-sm font-bold mb-1 border-2 border-white/20`}
                      >
                        {getInitials(attendee.name)}
                      </div>
                      <div className="text-xs text-gray-300 max-w-[60px] truncate">
                        {attendee.name?.split(" ")[0] || "User"}
                      </div>
                    </div>
                  );
                })}

                {/* Show +more indicator */}
                {totalAttendees > 5 && (
                  <div className="shrink-0 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold mb-1">
                      +{totalAttendees - 5}
                    </div>
                    <div className="text-xs text-gray-400">more</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">
                No attendees yet. Be the first!
              </p>
            </div>
          )}
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

      {/* Booking Modal */}
      <BookingModal
        event={event}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </div>
  );
}
