"use client";

import { useState, useEffect } from "react";

export default function EventReviews({ eventId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [eventId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Fetch reviews for this event
      const reviewsRes = await fetch(`/api/reviews?eventId=${eventId}`);
      const reviewsData = await reviewsRes.json();

      // Fetch stats for this event
      const statsRes = await fetch(`/api/reviews/stats?eventId=${eventId}`);
      const statsData = await statsRes.json();

      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">⭐</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-600">
          Be the first to review this event during its active period!
        </p>
        <a
          href="/gamification"
          className="inline-block mt-4 px-6 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Go to Leaderboard
        </a>
      </div>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            User Reviews
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-2xl ${
                    star <= Math.round(stats.averageRating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="text-lg">
              <span className="font-bold text-gray-900">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-gray-500 ml-2">
                ({stats.totalReviews}{" "}
                {stats.totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </div>
        <a
          href="/gamification"
          className="px-4 py-2 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all text-sm"
        >
          View All Events
        </a>
      </div>

      {/* Rating Distribution */}
      <div className="mb-6 space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating] || 0;
          const percentage =
            stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16 shrink-0">
                <span className="text-sm font-medium text-gray-700">
                  {rating}
                </span>
                <span className="text-yellow-400 text-sm">★</span>
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <div
            key={review.id}
            className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {review.user_name}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= review.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            {review.review_text && (
              <p className="text-gray-700 text-sm leading-relaxed">
                {review.review_text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
        >
          {showAll ? "Show Less" : `Show All ${reviews.length} Reviews`}
        </button>
      )}
    </div>
  );
}
