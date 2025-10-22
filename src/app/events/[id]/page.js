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

  useEffect(() => {
    if (!p?.id) return;

    fetch(`/api/events/${p.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setEvent(data.event);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
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
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Home
              </Link>
              <Link
                href="/events"
                className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg transition-all"
              >
                Events
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
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg ml-2"
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
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
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

                          {/* Play button for videos */}
                          {media.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                                <span className="text-black text-xl ml-1">
                                  ▶
                                </span>
                              </div>
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

              {activeTab === "attendees" && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 mb-6">
                    <span className="text-5xl">👥</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {event._count?.bookings || 0} Attendees
                  </h3>
                  <p className="text-gray-400">Registered for this event</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing Card */}
            <div className="sticky top-28 backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-black/40 shadow-2xl">
              <div className="text-center mb-6 pb-6 border-b border-white/10">
                <div className="text-5xl font-bold text-white mb-2">
                  ${event.price || 499}
                </div>
                <div className="text-sm text-gray-400">per ticket</div>
              </div>

              {/* Availability Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-400">Availability</span>
                  <span className="font-semibold text-white">
                    {availableSpots} / {event.capacity || 1000}
                  </span>
                </div>
                <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.max(5, bookedPercentage))}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round(bookedPercentage)}% filled
                </p>
              </div>

              {/* CTA Button */}
              {user ? (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] mb-3"
                >
                  Book Now
                </button>
              ) : (
                <Link
                  href="/"
                  className="w-full inline-block text-center bg-linear-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] mb-3"
                >
                  Sign In to Book
                </Link>
              )}

              <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                <span>✓</span>
                <span>Free cancellation until 24 hours before</span>
              </p>
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
                      {event.time || "09:00 AM"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center text-2xl">
                    📍
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">
                      Location
                    </div>
                    <div className="text-sm text-gray-300">Hall A & B</div>
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
