"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import UploadReelModal from "@/components/UploadReelModal";

// These should match your Instagram hashtags in .env.local
const AVAILABLE_TAGS = [
  "all",
  "eventhub",
  "music",
  "technology",
  "food",
  "art",
  "sports",
  "gaming",
  "travel",
  "fitness",
  "fashion",
  "education",
  "entertainment",
];

export default function ReelsPage() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTag, setSelectedTag] = useState("all");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const [error, setError] = useState(null);

  // Fetch reels from database
  const fetchReels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/reels?tag=${selectedTag}&limit=50`);
      const data = await response.json();
      
      if (data.error && data.reels.length === 0) {
        setError(data.error || "Failed to fetch reels");
        setReels([]);
      } else {
        setReels(data.reels || []);
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
      setError("Unable to load reels. Please try again later.");
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTag]);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  // Handle scroll/swipe navigation
  const scrollToReel = useCallback((index) => {
    if (containerRef.current) {
      const reelHeight = window.innerHeight;
      containerRef.current.scrollTo({
        top: index * reelHeight,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  }, []);

  // Handle wheel scroll
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0 && currentIndex < reels.length - 1) {
          scrollToReel(currentIndex + 1);
        } else if (e.deltaY < 0 && currentIndex > 0) {
          scrollToReel(currentIndex - 1);
        }
      }
    },
    [currentIndex, reels.length, scrollToReel]
  );

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = useCallback(
    (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY.current - touchEndY;

      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentIndex < reels.length - 1) {
          scrollToReel(currentIndex + 1);
        } else if (diff < 0 && currentIndex > 0) {
          scrollToReel(currentIndex - 1);
        }
      }
    },
    [currentIndex, reels.length, scrollToReel]
  );

  // Like/Unlike functionality
  const handleLike = async (reelId) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    const isLiked = likedReels.has(reelId);

    try {
      if (isLiked) {
        await fetch(`/api/reels/${reelId}/like?userId=${user.id}`, {
          method: "DELETE",
        });
        setLikedReels((prev) => {
          const newSet = new Set(prev);
          newSet.delete(reelId);
          return newSet;
        });
        // Update local state
        setReels((prev) =>
          prev.map((reel) =>
            reel.id === reelId
              ? { ...reel, likes_count: reel.likes_count - 1 }
              : reel
          )
        );
      } else {
        await fetch(`/api/reels/${reelId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        setLikedReels((prev) => new Set([...prev, reelId]));
        // Update local state
        setReels((prev) =>
          prev.map((reel) =>
            reel.id === reelId
              ? { ...reel, likes_count: reel.likes_count + 1 }
              : reel
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <Navbar setShowLogin={setShowLogin} setShowSignup={setShowSignup} />
      </div>

      {/* Tag Filter */}
      <div className="fixed top-16 left-0 right-0 z-40 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(tag);
                setCurrentIndex(0);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Reels Container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {loading ? (
          <div className="h-screen w-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading reels...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-screen w-full flex items-center justify-center">
            <div className="text-center px-4 max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-white text-2xl font-bold mb-2">
                Unable to load posts
              </h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchReels}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full hover:scale-105 transition-transform"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : reels.length === 0 ? (
          <div className="h-screen w-full flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-white text-2xl font-bold mb-2">
                No posts found
              </h3>
              <p className="text-gray-400 mb-2">
                No reels found with #{selectedTag}
              </p>
              <p className="text-gray-500 text-sm">
                Be the first to upload a reel with this hashtag!
              </p>
            </div>
          </div>
        ) : (
          reels.map((reel, index) => (
            <div
              key={reel.id}
              className="h-screen w-full snap-start relative flex items-center justify-center"
            >
              {/* Background Image/Video */}
              {reel.media_type === "video" ? (
                <video
                  src={reel.media_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay={index === currentIndex}
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={reel.media_url}
                  alt={reel.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 pt-32 pb-20">
                {/* Top Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {reel.username?.[0]?.toUpperCase() || "I"}
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      @{reel.username || "instagram"}
                    </p>
                    <p className="text-gray-300 text-xs">
                      {new Date(reel.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-2xl">📷</span>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="space-y-3">
                  <h2 className="text-white text-xl font-bold drop-shadow-lg line-clamp-2">
                    {reel.title}
                  </h2>
                  {reel.description && reel.description !== reel.title && (
                    <p className="text-white text-sm drop-shadow-lg line-clamp-3">
                      {reel.description}
                    </p>
                  )}
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {reel.tags?.slice(0, 5).map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons (Right Side) */}
              <div className="absolute right-4 bottom-32 flex flex-col gap-6">
                {/* Like Count (Read-only from Instagram) */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <span className="text-2xl">❤️</span>
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    {reel.likes_count || 0}
                  </span>
                </div>

                {/* Comment Count (Read-only from Instagram) */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    {reel.comments_count || 0}
                  </span>
                </div>

                {/* View on Instagram Button */}
                {reel.permalink && (
                  <a
                    href={reel.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-all shadow-lg">
                      <span className="text-2xl">📷</span>
                    </div>
                    <span className="text-white text-xs font-semibold drop-shadow-lg">
                      View
                    </span>
                  </a>
                )}
              </div>

              {/* Navigation Indicators */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {reels.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToReel(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === currentIndex
                        ? "bg-white h-8"
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Reel Button */}
      <button
        onClick={() => {
          if (!user) {
            setShowLogin(true);
          } else {
            setShowUploadModal(true);
          }
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
      >
        <span className="text-white text-3xl font-bold">+</span>
      </button>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadReelModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newReel) => {
            // Add new reel to the top of the list
            setReels((prev) => [newReel, ...prev]);
            setShowUploadModal(false);
            // Scroll to top to show the new reel
            setCurrentIndex(0);
            scrollToReel(0);
          }}
        />
      )}

      {/* Auth Modals */}
      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}
      {showSignup && (
        <SignupForm
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
