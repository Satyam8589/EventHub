"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import EventHubLogo from "@/components/EventHubLogo";

export default function GamificationPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("rating"); // rating, recent, popular
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [particles, setParticles] = useState([]);

  // Close modals when user becomes authenticated
  useEffect(() => {
    if (user && !authLoading) {
      setShowLogin(false);
      setShowSignup(false);
    }
  }, [user, authLoading]);

  // Mouse tracking for animated background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate particles for background animation
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [...Array(50)].map((_, i) => ({
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

  // Fetch events with reviews - auto-refresh every 30 seconds
  useEffect(() => {
    fetchEventsWithReviews();

    // Auto-refresh every 30 seconds to get latest reviews
    const interval = setInterval(() => {
      fetchEventsWithReviews();
    }, 30000);

    return () => clearInterval(interval);
  }, [sortBy]);

  const fetchEventsWithReviews = async () => {
    try {
      setLoading(true);

      // Fetch all events (including expired for leaderboard)
      const eventsRes = await fetch("/api/leaderboard");
      const eventsData = await eventsRes.json();
      console.log("Events data:", eventsData);

      // Fetch all review stats
      const statsRes = await fetch("/api/reviews/stats");
      const statsData = await statsRes.json();
      console.log(
        "Stats data:",
        statsData,
        "Is array:",
        Array.isArray(statsData)
      );

      // Fetch user's reviews if logged in
      let userReviewsData = [];
      if (user) {
        const userReviewsRes = await fetch(`/api/reviews?userId=${user.uid}`);
        userReviewsData = await userReviewsRes.json();
        console.log("User reviews data:", userReviewsData);
      }

      // Create stats map - ensure statsData is an array
      const statsMap = {};
      const statsArray = Array.isArray(statsData) ? statsData : [];
      statsArray.forEach((stat) => {
        statsMap[stat.eventId] = stat;
      });

      // Create user reviews map - ensure userReviewsData is an array
      const userReviewsMap = {};
      const reviewsArray = Array.isArray(userReviewsData)
        ? userReviewsData
        : [];
      reviewsArray.forEach((review) => {
        userReviewsMap[review.eventId] = review;
      });

      // Merge data
      const eventsWithReviews = (eventsData.events || eventsData).map(
        (event) => {
          return {
            ...event,
            reviewStats: statsMap[event.id] || {
              totalReviews: 0,
              averageRating: 0,
            },
            userReview: userReviewsMap[event.id] || null,
            canReview: isEventInProgress(event),
            isExpired: isEventExpired(event),
          };
        }
      );

      // Sort events
      let sortedEvents = [...eventsWithReviews];
      if (sortBy === "rating") {
        sortedEvents.sort((a, b) => {
          if (b.reviewStats.averageRating !== a.reviewStats.averageRating) {
            return b.reviewStats.averageRating - a.reviewStats.averageRating;
          }
          return b.reviewStats.totalReviews - a.reviewStats.totalReviews;
        });
      } else if (sortBy === "recent") {
        sortedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else if (sortBy === "popular") {
        sortedEvents.sort(
          (a, b) => b.reviewStats.totalReviews - a.reviewStats.totalReviews
        );
      }

      setEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const isEventInProgress = (event) => {
    const now = new Date();
    const endDate = event.endDate ? new Date(event.endDate) : null;

    console.log("Event:", event.title, {
      now: now.toISOString(),
      endDate: endDate ? endDate.toISOString() : "No end date",
      hasEndDate: !!endDate,
      isBeforeEnd: endDate ? now <= endDate : true,
    });

    // Users can review from the moment event is registered until it ends
    // If no end date, event is always reviewable
    if (!endDate) {
      return true;
    }

    // Event is reviewable until the end date
    return now <= endDate;
  };

  // Helper function to check if an event is expired
  const isEventExpired = (event) => {
    const now = new Date();

    // Check if event is cancelled
    if (event.status === "CANCELLED") {
      return false; // Cancelled events are not "expired", they're cancelled
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

  const openReviewModal = (event) => {
    if (!user) {
      alert(
        "Please login to write a review. You can view the leaderboard without logging in, but need to be logged in to submit reviews."
      );
      return;
    }

    setSelectedEvent(event);
    if (event.userReview) {
      setRating(event.userReview.rating);
      setReviewText(event.userReview.review_text || "");
      setUserReview(event.userReview);
    } else {
      setRating(0);
      setReviewText("");
      setUserReview(null);
    }
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedEvent(null);
    setRating(0);
    setReviewText("");
    setUserReview(null);
  };

  const submitReview = async () => {
    if (!user) {
      alert("Please login to submit a review");
      return;
    }

    if (!rating || !selectedEvent) return;

    try {
      setSubmitting(true);

      console.log("Submitting review for event:", {
        eventId: selectedEvent.id,
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        rating,
        reviewText,
      });

      if (userReview) {
        // Update existing review
        const res = await fetch("/api/reviews", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewId: userReview.id,
            rating,
            reviewText,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          console.error("Update review error:", error);
          throw new Error(error.error || "Failed to update review");
        }
      } else {
        // Create new review
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: selectedEvent.id,
            userId: user.uid,
            userName: user.displayName || user.email,
            userEmail: user.email,
            rating,
            reviewText,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          console.error("Create review error:", error);
          throw new Error(error.error || "Failed to submit review");
        }
      }

      // Refresh events immediately after review
      await fetchEventsWithReviews();
      closeReviewModal();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete your review?")) return;

    try {
      const res = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete review");

      await fetchEventsWithReviews();
      closeReviewModal();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements - Same as Home Page */}
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
        <div
          className="absolute w-96 h-96 bg-linear-to-r from-yellow-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 top-20 right-20"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${
              mousePosition.y * -0.01
            }px)`,
          }}
        />
        <div
          className="absolute w-96 h-96 bg-linear-to-r from-green-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 bottom-20 left-20"
          style={{
            transform: `translate(${mousePosition.x * 0.015}px, ${
              mousePosition.y * 0.015
            }px)`,
          }}
        />
      </div>

      {/* Navigation - Same as Home Page */}
      <Navbar setShowLogin={setShowLogin} setShowSignup={setShowSignup} />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            🏆 Event Leaderboard & Reviews
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-6">
            Discover the best events based on community reviews and ratings.
            View all events including completed ones.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white border border-white/20">
              <span>⭐</span>
              <span>Rate Events</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white border border-white/20">
              <span>📝</span>
              <span>Write Reviews</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white border border-white/20">
              <span>🔄</span>
              <span>Live Updates</span>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 mb-8 shadow-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-white font-semibold text-lg">Sort by:</span>
            <div className="flex gap-3">
              <button
                onClick={() => setSortBy("rating")}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  sortBy === "rating"
                    ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/30"
                }`}
              >
                ⭐ Top Rated
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  sortBy === "popular"
                    ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/30"
                }`}
              >
                🔥 Most Reviewed
              </button>
              <button
                onClick={() => setSortBy("recent")}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  sortBy === "recent"
                    ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/30"
                }`}
              >
                🕐 Recent
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-xl font-medium text-white">
              Loading Leaderboard...
            </div>
            <div className="text-sm text-gray-400 mt-2">Please wait</div>
          </div>
        ) : events.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-12 text-center shadow-2xl">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No Events Found
            </h3>
            <p className="text-gray-300 mb-6">
              Check back later for upcoming events to review!
            </p>
            <a
              href="/events"
              className="inline-block px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Browse Events
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`backdrop-blur-xl bg-white/10 rounded-xl border border-white/20 shadow-xl hover:shadow-blue-500/30 transition-all duration-300 overflow-hidden group hover:scale-[1.01] transform ${
                  event.isExpired
                    ? "opacity-75 bg-gray-600/10 border-gray-500/30"
                    : ""
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Rank Badge */}
                    <div className="shrink-0 sm:w-14">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg ${
                          index === 0
                            ? "bg-linear-to-br from-yellow-400 to-yellow-600 text-white shadow-yellow-500/50"
                            : index === 1
                            ? "bg-linear-to-br from-gray-300 to-gray-500 text-white shadow-gray-400/50"
                            : index === 2
                            ? "bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-orange-500/50"
                            : "bg-white/20 text-white border-2 border-white/30"
                        }`}
                      >
                        #{index + 1}
                      </div>
                    </div>

                    {/* Event Image */}
                    <div className="shrink-0">
                      <img
                        src={event.imageUrl || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="w-full sm:w-28 h-28 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
                            {event.title}
                          </h3>
                          <p className="text-xs text-gray-300 line-clamp-1">
                            {event.description}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col gap-1">
                          {event.featured && (
                            <span className="px-2 py-0.5 bg-linear-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold rounded-full animate-pulse shadow-md">
                              ⭐
                            </span>
                          )}
                          {event.isExpired && (
                            <span className="px-2 py-0.5 bg-red-500/80 text-white text-xs font-bold rounded-full shadow-md">
                              ⏰ EXPIRED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rating Display */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-base ${
                                  star <=
                                  Math.round(event.reviewStats.averageRating)
                                    ? "text-yellow-400"
                                    : "text-gray-500"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-base font-bold text-white">
                            {event.reviewStats.averageRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-300">
                            ({event.reviewStats.totalReviews})
                          </span>
                        </div>

                        {event.userReview && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full border border-green-500/50">
                            ✓ Reviewed
                          </span>
                        )}

                        {event.canReview && !event.userReview && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/50">
                            Review now
                          </span>
                        )}
                      </div>

                      {/* Event Dates */}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-300 mb-3">
                        <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg">
                          <span>📅</span>
                          <span>
                            {new Date(event.date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              timeZone: "Asia/Kolkata",
                            })}
                          </span>
                        </div>
                        {event.endDate && event.endDate !== event.date && (
                          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg">
                            <span>→</span>
                            <span>
                              {new Date(event.endDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg">
                          <span>📍</span>
                          <span className="line-clamp-1 max-w-[150px]">
                            {event.location}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {event.isExpired ? (
                          <div className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm font-medium border border-red-500/30">
                            Event Expired
                          </div>
                        ) : (
                          <Link
                            href={`/events/${event.id}`}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all border border-white/30 hover:border-white/50"
                          >
                            Details
                          </Link>
                        )}
                        {!user ? (
                          <button
                            onClick={() => openReviewModal(event)}
                            className="px-3 py-1.5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-md shadow-blue-500/30 hover:shadow-blue-500/50"
                          >
                            Login to Review
                          </button>
                        ) : event.canReview ? (
                          <button
                            onClick={() => openReviewModal(event)}
                            className="px-3 py-1.5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-md shadow-blue-500/30 hover:shadow-blue-500/50"
                          >
                            {event.userReview ? "Edit" : "Review"}
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed border border-white/20">
                            Ended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-linear-to-br from-gray-900/95 to-blue-900/95 border border-white/20 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 sm:p-8">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {userReview ? "Edit Your Review" : "Write a Review"}
                  </h3>
                  <p className="text-gray-300">{selectedEvent.title}</p>
                </div>
                <button
                  onClick={closeReviewModal}
                  className="text-gray-400 hover:text-white text-4xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  Your Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-5xl transition-all transform hover:scale-110"
                    >
                      <span
                        className={
                          star <= rating ? "text-yellow-400" : "text-gray-600"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="mt-2 text-sm text-gray-300">
                    {rating === 5 && "⭐ Excellent!"}
                    {rating === 4 && "👍 Very Good"}
                    {rating === 3 && "😊 Good"}
                    {rating === 2 && "😐 Fair"}
                    {rating === 1 && "😞 Poor"}
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  Your Review (Optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Share your experience with this event..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={submitReview}
                  disabled={!rating || submitting}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50"
                >
                  {submitting
                    ? "Submitting..."
                    : userReview
                    ? "Update Review"
                    : "Submit Review"}
                </button>
                {userReview && (
                  <button
                    onClick={() => deleteReview(userReview.id)}
                    className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/50 rounded-xl font-semibold transition-all"
                  >
                    Delete Review
                  </button>
                )}
                <button
                  onClick={closeReviewModal}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}

      {/* Signup Modal */}
      {showSignup && (
        <SignupForm
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
    </div>
  );
}
