"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TicketModal from "@/components/TicketModal";
import EventHubLogo from "@/components/EventHubLogo";

export default function MyEventsPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [sendingEmail, setSendingEmail] = useState(null); // Track which booking is sending email
  const [emailSent, setEmailSent] = useState(new Set()); // Track which bookings had email sent

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

  // Load emailSent state from localStorage on component mount
  useEffect(() => {
    try {
      const savedEmailSent = localStorage.getItem("emailSent");
      if (savedEmailSent) {
        const parsedEmailSent = JSON.parse(savedEmailSent);
        setEmailSent(new Set(parsedEmailSent));
      }
    } catch (error) {
      console.error("Error loading emailSent state from localStorage:", error);
    }
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

        // Add cache buster and fetch only CONFIRMED bookings
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

        console.log("Fetch response status:", response.status);
        console.log("Fetch response ok:", response.ok);

        // Always try to parse response, even if not ok
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          const textResponse = await response.text();
          console.error("Raw response:", textResponse);
          setBookings([]);
          return;
        }

        if (response.ok) {
          console.log("API Response:", data);
          console.log("Received bookings:", data.bookings?.length || 0);
          console.log("Bookings data:", data.bookings);

          // Log each booking's event data
          data.bookings?.forEach((booking, index) => {
            console.log(`Booking ${index + 1}:`, {
              id: booking.id,
              status: booking.status,
              hasEvent: !!booking.event,
              eventId: booking.eventId,
              eventDate: booking.event?.date,
              eventName: booking.event?.name,
            });
          });

          setBookings(data.bookings || []);
        } else {
          console.error("Failed to fetch bookings:", response.status);
          console.error("Error response:", data);
          // Even on error, use bookings array if provided
          setBookings(data.bookings || []);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchBookings();
    }
  }, [user, authLoading]);

  // Refresh bookings when page becomes visible (e.g., returning from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log("Page became visible - refreshing bookings...");
        const fetchBookings = async () => {
          try {
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
              console.log("Refreshed bookings:", data.bookings?.length || 0);
              setBookings(data.bookings || []);
            }
          } catch (error) {
            console.error("Error refreshing bookings:", error);
          }
        };

        fetchBookings();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user]);

  // Filter bookings by upcoming/ongoing/past with precise date and time support
  const filterBookings = (bookings, type) => {
    const now = new Date();
    console.log(`Filtering ${bookings.length} bookings for ${type} events`);

    const filtered = bookings.filter((booking) => {
      // Safety check for event and date existence
      if (!booking.event || !booking.event.date) {
        console.warn("Booking missing event or date - EXCLUDING:", {
          bookingId: booking.id,
          hasEvent: !!booking.event,
          eventId: booking.eventId,
          status: booking.status,
        });
        return false; // Skip bookings without valid event data
      }

      // Calculate start and end date/time for the event
      const eventStartDate = new Date(booking.event.date);

      // Validate start date
      if (isNaN(eventStartDate.getTime())) {
        console.error("Invalid start date for booking:", {
          bookingId: booking?.id || "unknown",
          eventDate: booking?.event?.date || "undefined",
          eventTitle: booking?.event?.title || "undefined",
          fullBooking: booking,
        });
        return false; // Skip bookings with invalid start dates
      }

      let eventEndDateTime;
      if (booking.event.endDate || booking.event.enddate) {
        // Event has an end date/time
        eventEndDateTime = new Date(
          booking.event.endDate || booking.event.enddate
        );

        // Validate end date
        if (isNaN(eventEndDateTime.getTime())) {
          console.error("Invalid end date for booking:", {
            bookingId: booking?.id || "unknown",
            endDate:
              booking?.event?.endDate || booking?.event?.enddate || "undefined",
            eventTitle: booking?.event?.title || "undefined",
            fullBooking: booking,
          });
          // Fall back to creating end time from start date
          eventEndDateTime = new Date(eventStartDate);
          eventEndDateTime.setHours(23, 59, 59, 999);
        }
      } else {
        // No end date, create end time from start date + time
        if (booking.event.time) {
          // If event has a specific time, use that date with time
          eventEndDateTime = new Date(
            `${booking.event.date}T${booking.event.time}`
          );

          // Validate combined date/time
          if (isNaN(eventEndDateTime.getTime())) {
            console.error("Invalid date/time combination for booking:", {
              bookingId: booking?.id || "unknown",
              eventDate: booking?.event?.date || "undefined",
              eventTime: booking?.event?.time || "undefined",
              eventTitle: booking?.event?.title || "undefined",
              fullBooking: booking,
            });
            // Fall back to end of day
            eventEndDateTime = new Date(eventStartDate);
            eventEndDateTime.setHours(23, 59, 59, 999);
          }
        } else {
          // If no specific time, assume event ends at end of day
          eventEndDateTime = new Date(eventStartDate);
          eventEndDateTime.setHours(23, 59, 59, 999);
        }
      }

      // Determine event status
      const isUpcoming = now < eventStartDate;
      const isOngoing = now >= eventStartDate && now <= eventEndDateTime;
      const isPast = now > eventEndDateTime;

      let result = false;
      switch (type) {
        case "upcoming":
          result = isUpcoming;
          break;
        case "ongoing":
          result = isOngoing;
          break;
        case "past":
          result = isPast;
          break;
        default:
          result = false;
      }

      console.log(`Booking ${booking?.id || "unknown"}:`, {
        eventName: booking?.event?.title || "undefined",
        eventStartDate: booking?.event?.date || "undefined",
        eventEndDate:
          booking?.event?.endDate || booking?.event?.enddate || "undefined",
        eventTime: booking?.event?.time || "undefined",
        calculatedStartDateTime: isNaN(eventStartDate.getTime())
          ? "Invalid Date"
          : eventStartDate.toISOString(),
        calculatedEndDateTime: isNaN(eventEndDateTime.getTime())
          ? "Invalid Date"
          : eventEndDateTime.toISOString(),
        currentTime: now.toISOString(),
        isUpcoming,
        isOngoing,
        isPast,
        typeFilter: type,
        included: result,
      });

      return result;
    });

    console.log(`Filtered result: ${filtered.length} ${type} bookings`);
    return filtered;
  };

  const upcomingBookings = filterBookings(bookings, "upcoming");
  const ongoingBookings = filterBookings(bookings, "ongoing");
  const pastBookings = filterBookings(bookings, "past");

  // Function to send ticket email on demand
  const sendTicketEmail = async (booking) => {
    // Prevent double-clicking if already sent or currently sending
    if (sendingEmail === booking.id || emailSent.has(booking.id)) {
      return;
    }

    try {
      setSendingEmail(booking.id);

      console.log("📧 Sending email for booking:", booking.id);
      
      const response = await fetch("/api/send-ticket-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
        }),
      });

      console.log("📧 Email API response status:", response.status);
      console.log("📧 Email API response headers:", [...response.headers.entries()]);

      if (!response.ok) {
        // Log the raw response for debugging
        const responseText = await response.text();
        console.error("❌ Email API failed:");
        console.error("Status:", response.status);
        console.error("Status Text:", response.statusText);
        console.error("Response Text:", responseText);
        
        setSendingEmail(null);
        alert("❌ Failed to send ticket email. Please try again.");
        return;
      }

      const result = await response.json();

      if (response.ok && result.success) {
        // Mark this booking as having email sent
        setEmailSent((prev) => {
          const newSet = new Set([...prev, booking.id]);
          // Persist to localStorage
          localStorage.setItem(
            "emailSentBookings",
            JSON.stringify([...newSet])
          );
          return newSet;
        });

        // Show success message without alert
        console.log(
          "✅ Ticket sent to Gmail successfully for booking:",
          booking.id
        );

        // Optional: You can add a toast notification here instead of alert
        // For now, the green button state provides sufficient feedback
      } else {
        console.error("❌ Failed to send ticket email:", result.error);
        alert(
          "❌ Failed to send ticket email: " + (result.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error sending ticket email:", error);
      alert("❌ Failed to send ticket email. Please try again.");
    } finally {
      setSendingEmail(null);
    }
  };

  // Helper function to check if an event is expired (with precise date and time)
  const isEventExpired = (event) => {
    if (!event || !event.date) return false;

    const now = new Date();

    // Use endDate if available (includes both date and time), otherwise use start date
    let eventEndDateTime;
    if (event.endDate || event.enddate) {
      // Event has an end date/time
      eventEndDateTime = new Date(event.endDate || event.enddate);
    } else {
      // No end date, create end time from start date + time
      const eventDate = new Date(event.date);
      if (event.time) {
        // If event has a specific time, use that date with time
        eventEndDateTime = eventDate;
      } else {
        // If no specific time, assume event ends at end of day
        eventEndDateTime = new Date(eventDate);
        eventEndDateTime.setHours(23, 59, 59, 999);
      }
    }

    return eventEndDateTime < now;
  };

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
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <EventHubLogo size={64} showText={false} />
              </div>

              <div className="w-20 h-20 mx-auto mb-6 bg-linear-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
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

              <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Authentication Required
              </h1>
              <p className="text-gray-300 mb-2 leading-relaxed">
                Sign in to access your booked events, manage your tickets, and
                view your event history.
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
                  className="inline-flex items-center gap-2 w-full justify-center bg-linear-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
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
              onClick={() => setActiveTab("ongoing")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "ongoing"
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Ongoing ({ongoingBookings.length})
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
            {(() => {
              let currentBookings;
              if (activeTab === "upcoming") {
                currentBookings = upcomingBookings;
              } else if (activeTab === "ongoing") {
                currentBookings = ongoingBookings;
              } else {
                currentBookings = pastBookings;
              }

              return currentBookings.length === 0 ? (
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
                        : activeTab === "ongoing"
                        ? "You don't have any ongoing events right now. Events that are currently happening will appear here."
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
                currentBookings.map((booking) => (
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
                        {(() => {
                          const now = new Date();
                          const eventStartDate = new Date(booking.event.date);

                          let eventEndDateTime;
                          if (booking.event.endDate || booking.event.enddate) {
                            eventEndDateTime = new Date(
                              booking.event.endDate || booking.event.enddate
                            );
                          } else if (booking.event.time) {
                            eventEndDateTime = new Date(
                              `${booking.event.date}T${booking.event.time}`
                            );
                          } else {
                            eventEndDateTime = new Date(eventStartDate);
                            eventEndDateTime.setHours(23, 59, 59, 999);
                          }

                          const isUpcoming = now < eventStartDate;
                          const isOngoing =
                            now >= eventStartDate && now <= eventEndDateTime;
                          const isPast = now > eventEndDateTime;

                          if (isUpcoming) {
                            return (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/80 text-white">
                                Upcoming
                              </span>
                            );
                          } else if (isOngoing) {
                            return (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/80 text-white animate-pulse">
                                Live Now
                              </span>
                            );
                          } else if (isPast) {
                            return (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-500/80 text-white">
                                Finished
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-500/80 text-white">
                                Event
                              </span>
                            );
                          }
                        })()}
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
                            {(() => {
                              const startDate = new Date(booking.event.date);
                              const endDate = booking.event.endDate
                                ? new Date(booking.event.endDate)
                                : null;

                              if (
                                endDate &&
                                startDate.toDateString() !==
                                  endDate.toDateString()
                              ) {
                                // Multi-day event
                                return `${startDate.toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )} - ${endDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}${
                                  booking.event.time
                                    ? ` • ${booking.event.time}`
                                    : ""
                                }`;
                              } else {
                                // Single day event
                                return formatEventDate(
                                  booking.event.date,
                                  booking.event.time
                                );
                              }
                            })()}
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
                        // Show "Event Completed" circular stamp for past events
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
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
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
                              {new Date(
                                booking.event.endDate ||
                                  booking.event.enddate ||
                                  booking.event.date
                              ).toLocaleDateString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Show buttons for upcoming/active events
                        <div className="space-y-2">
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

                          {/* Send Ticket to Email Button */}
                          <button
                            onClick={() => sendTicketEmail(booking)}
                            disabled={
                              sendingEmail === booking.id ||
                              emailSent.has(booking.id)
                            }
                            className={`w-full px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                              emailSent.has(booking.id)
                                ? "bg-green-600/30 text-green-200 border-green-500/50 cursor-not-allowed"
                                : sendingEmail === booking.id
                                ? "bg-gray-600/20 text-gray-300 border-gray-500/30 cursor-not-allowed"
                                : "bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30 cursor-pointer"
                            }`}
                          >
                            {sendingEmail === booking.id ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-transparent"></div>
                                <span>Sending...</span>
                              </div>
                            ) : emailSent.has(booking.id) ? (
                              <div className="flex items-center justify-center gap-2">
                                <svg
                                  className="w-4 h-4 text-green-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span className="font-semibold">
                                  Ticket Sent to Gmail
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <svg
                                  className="w-4 h-4 text-purple-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>Send Ticket to Gmail</span>
                              </div>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              );
            })()}
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
