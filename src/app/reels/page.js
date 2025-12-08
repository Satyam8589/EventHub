"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import CommentsModal from "@/components/CommentsModal";
import UploadReelModal from "@/components/UploadReelModal";

// Utility function to get video MIME type from URL
const getVideoMimeType = (url) => {
  if (!url) return "video/mp4";
  const extension = url.split(".").pop().split("?")[0].toLowerCase();
  const mimeTypes = {
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    mov: "video/quicktime",
    m4v: "video/x-m4v",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
  };
  return mimeTypes[extension] || "video/mp4";
};

// Function to get badge based on reel count
const getBadgeForReelCount = (count) => {
  if (count >= 300)
    return { emoji: "💎", name: "Diamond", color: "from-cyan-400 to-blue-500" };
  if (count >= 200)
    return {
      emoji: "🏆",
      name: "Platinum",
      color: "from-gray-300 to-gray-500",
    };
  if (count >= 100)
    return {
      emoji: "🥇",
      name: "Gold",
      color: "from-yellow-400 to-yellow-600",
    };
  if (count >= 50)
    return { emoji: "🥈", name: "Silver", color: "from-gray-400 to-gray-600" };
  if (count >= 1)
    return {
      emoji: "🥉",
      name: "Bronze",
      color: "from-orange-400 to-orange-600",
    };
  return null;
};

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTag, setSelectedTag] = useState("all");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartScrollTop = useRef(0);
  const scrollTimeout = useRef(null);
  const isScrolling = useRef(false);
  const isTouching = useRef(false);
  const [error, setError] = useState(null);
  const [currentUserUsername, setCurrentUserUsername] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedReelForComments, setSelectedReelForComments] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReels, setUserReels] = useState([]);
  const [loadingUserReels, setLoadingUserReels] = useState(false);
  const [likedReels, setLikedReels] = useState(new Set());
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [userBadges, setUserBadges] = useState(new Map());
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [followLoading, setFollowLoading] = useState(new Set());
  const REELS_PER_PAGE = 20;

  // Fetch reels from database with pagination
  const fetchReels = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const offset = (pageNum - 1) * REELS_PER_PAGE;
        const response = await fetch(
          `/api/reels?tag=${selectedTag}&limit=${REELS_PER_PAGE}&offset=${offset}`
        );
        const data = await response.json();

        if (data.error && (!data.reels || data.reels.length === 0)) {
          if (pageNum === 1) {
            setError(data.error || "Failed to fetch reels");
            setReels([]);
          }
          setHasMore(false);
        } else {
          const newReels = data.reels || [];

          if (append) {
            setReels((prev) => [...prev, ...newReels]);
          } else {
            setReels(newReels);
          }

          // Check if there are more reels to load
          setHasMore(newReels.length === REELS_PER_PAGE);

          // Fetch badge information for each unique user
          const uniqueUserIds = [
            ...new Set(newReels.map((reel) => reel.user_id)),
          ];
          for (const userId of uniqueUserIds) {
            if (!userBadges.has(userId)) {
              try {
                const badgeResponse = await fetch(
                  `/api/reels?userId=${userId}&limit=1000`
                );
                const badgeData = await badgeResponse.json();
                const reelCount = badgeData.reels?.length || 0;
                const badge = getBadgeForReelCount(reelCount);
                setUserBadges((prev) =>
                  new Map(prev).set(userId, { badge, count: reelCount })
                );
              } catch (error) {
                console.error("Error fetching user badge:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching reels:", error);
        if (pageNum === 1) {
          setError("Unable to load reels. Please try again later.");
          setReels([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedTag]
  );

  // Initial fetch and when tag changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setCurrentIndex(0);
    // Reset scroll position immediately
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    fetchReels(1, false);
  }, [fetchReels]);

  // Scroll to first reel when reels are loaded
  useEffect(() => {
    if (reels.length > 0 && containerRef.current) {
      // Multiple attempts to ensure scroll snap works
      const scrollToFirst = () => {
        if (containerRef.current) {
          const firstReel = containerRef.current.firstElementChild;
          if (firstReel) {
            firstReel.scrollIntoView({ behavior: "instant", block: "start" });
            setCurrentIndex(0);
          }
        }
      };

      // Try immediately
      scrollToFirst();

      // Try again after DOM is fully ready
      setTimeout(scrollToFirst, 100);
      setTimeout(scrollToFirst, 300);
    }
  }, [reels.length]);

  // Track scroll position to update current index and load more reels
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollEndTimer = null;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / containerHeight);

      if (
        newIndex !== currentIndex &&
        newIndex >= 0 &&
        newIndex < reels.length
      ) {
        setCurrentIndex(newIndex);
      }

      // Load more reels when approaching the end (within last 3 reels)
      if (newIndex >= reels.length - 3 && hasMore && !loadingMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchReels(nextPage, true);
      }

      // Clear previous timer
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer);
      }

      // Set a timer to snap to nearest reel after scrolling stops
      scrollEndTimer = setTimeout(() => {
        if (!isTouching.current && !isScrolling.current) {
          const scrollTop = container.scrollTop;
          const containerHeight = container.clientHeight;
          const targetIndex = Math.round(scrollTop / containerHeight);
          const targetScroll = targetIndex * containerHeight;

          // Only snap if we're not already perfectly aligned
          if (Math.abs(scrollTop - targetScroll) > 1) {
            container.scrollTo({
              top: targetScroll,
              behavior: "smooth",
            });
            setCurrentIndex(targetIndex);
          }
        }
      }, 150); // Wait 150ms after scroll ends
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer);
      }
    };
  }, [
    currentIndex,
    reels.length,
    hasMore,
    loadingMore,
    loading,
    page,
    fetchReels,
  ]);

  // Fetch current user's username
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) {
        setCurrentUserUsername(null);
        return;
      }

      try {
        const response = await fetch(`/api/username?userId=${user.uid}`);
        const data = await response.json();
        setCurrentUserUsername(data.username || null);
      } catch (error) {
        console.error("Error fetching username:", error);
        setCurrentUserUsername(null);
      }
    };

    fetchUsername();
  }, [user]);

  // Fetch user's liked reels
  useEffect(() => {
    const fetchLikedReels = async () => {
      if (!user) {
        setLikedReels(new Set());
        return;
      }

      try {
        const response = await fetch(`/api/reels/liked?userId=${user.uid}`);
        const data = await response.json();
        if (data.likedReels) {
          setLikedReels(new Set(data.likedReels));
        }
      } catch (error) {
        console.error("Error fetching liked reels:", error);
      }
    };

    fetchLikedReels();
  }, [user]);

  // Fetch user's following list
  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user) {
        setFollowingUsers(new Set());
        return;
      }

      try {
        const response = await fetch(
          `/api/followers?userId=${user.uid}&type=following`
        );
        const data = await response.json();
        if (data.users) {
          setFollowingUsers(new Set(data.users.map((u) => u.id)));
        }
      } catch (error) {
        console.error("Error fetching following:", error);
      }
    };

    fetchFollowing();
  }, [user]);

  // Handle scroll/swipe navigation
  const scrollToReel = useCallback(
    (index) => {
      const container = containerRef.current;
      if (container && index >= 0 && index < reels.length) {
        const containerHeight = container.clientHeight;

        // Prevent rapid scrolling
        if (isScrolling.current) return;
        isScrolling.current = true;

        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          container.scrollTo({
            top: index * containerHeight,
            behavior: "smooth",
          });
        });

        setCurrentIndex(index);

        // Reset scrolling flag after animation completes
        setTimeout(() => {
          isScrolling.current = false;
        }, 1000); // Slower scrolling - ensures only one reel at a time
      }
    },
    [reels.length]
  );

  // Handle wheel scroll with throttling for smooth experience
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();

      // Prevent any scroll if already scrolling
      if (scrollTimeout.current || isScrolling.current) return;

      // Require larger delta for scroll (slower, more deliberate scrolling)
      if (Math.abs(e.deltaY) > 50) {
        // Only scroll one reel at a time
        if (e.deltaY > 0 && currentIndex < reels.length - 1) {
          scrollToReel(currentIndex + 1);
        } else if (e.deltaY < 0 && currentIndex > 0) {
          scrollToReel(currentIndex - 1);
        }

        // Set longer throttle timeout to prevent rapid scrolling
        scrollTimeout.current = setTimeout(() => {
          scrollTimeout.current = null;
        }, 800); // Slower throttle ensures one reel at a time
      }
    },
    [currentIndex, reels.length, scrollToReel]
  );

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    const container = containerRef.current;
    if (!container) return;

    isTouching.current = true;
    touchStartY.current = e.touches[0].clientY;
    touchStartScrollTop.current = container.scrollTop;
  };

  const handleTouchMove = (e) => {
    const container = containerRef.current;
    if (!container || !isTouching.current) return;

    const touchY = e.touches[0].clientY;
    const touchDiff = touchStartY.current - touchY;
    const currentScrollTop = container.scrollTop;

    // If user is dragging but hasn't completed a meaningful swipe,
    // prevent default to avoid partial scrolls
    if (Math.abs(touchDiff) < 80) {
      // Allow small movements but snap back
      const targetScrollTop = touchStartScrollTop.current;
      const containerHeight = container.clientHeight;
      const currentIndex = Math.round(targetScrollTop / containerHeight);

      // Ensure we stay at current reel position
      if (Math.abs(currentScrollTop - currentIndex * containerHeight) > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = useCallback(
    (e) => {
      const container = containerRef.current;
      if (!container) return;

      isTouching.current = false;
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY.current - touchEndY;

      // Increased threshold for more deliberate swiping
      if (Math.abs(diff) > 80) {
        // User made a deliberate swipe
        if (diff > 0 && currentIndex < reels.length - 1) {
          scrollToReel(currentIndex + 1);
        } else if (diff < 0 && currentIndex > 0) {
          scrollToReel(currentIndex - 1);
        }
      } else {
        // Small drag - snap back to current reel
        const containerHeight = container.clientHeight;
        const targetScroll = currentIndex * containerHeight;

        container.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }
    },
    [currentIndex, reels.length, scrollToReel]
  );

  const handleTouchCancel = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    isTouching.current = false;

    // Snap back to current reel on cancel
    const containerHeight = container.clientHeight;
    const targetScroll = currentIndex * containerHeight;

    container.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, [currentIndex]);

  const handleUploadClick = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (!currentUserUsername) {
      setShowUsernamePrompt(true);
      return;
    }

    setShowUploadModal(true);
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      {/* Fixed Navbar with Upload Button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="relative" style={{ height: "56px" }}>
          <div style={{ height: "56px", overflow: "hidden" }}>
            <Navbar setShowLogin={setShowLogin} setShowSignup={setShowSignup} />
          </div>

          {/* Upload Reel Button - Only show when user is logged in */}
          {user && (
            <button
              onClick={handleUploadClick}
              className="absolute top-3 right-4 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg hover:scale-110 transition-all z-10"
              title="Upload Reel"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Tag Filter */}
      <div className="fixed top-14 left-0 right-0 z-40 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm">
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
        className="mt-28 lg:mt-14 h-[calc(100vh-7rem)] lg:h-[calc(100vh-3.5rem)] w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          scrollSnapStop: "always",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          willChange: "scroll-position",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          perspective: 1000,
        }}
      >
        {loading ? (
          <div className="h-full w-full flex items-center justify-center snap-start">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading reels...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full w-full flex items-center justify-center snap-start">
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
          <div className="h-full w-full flex items-center justify-center snap-start">
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
              className="h-full w-full snap-start snap-always relative flex items-center justify-center bg-black"
              style={{
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                willChange: "transform",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
              }}
            >
              {/* Background Blur (for desktop) */}
              <div className="absolute inset-0 overflow-hidden">
                {reel.media_type === "video" ? (
                  <video
                    className="w-full h-full object-cover blur-2xl opacity-30 scale-110"
                    muted
                    playsInline
                  >
                    <source
                      src={reel.media_url}
                      type={getVideoMimeType(reel.media_url)}
                    />
                  </video>
                ) : (
                  <img
                    src={reel.media_url}
                    alt=""
                    className="w-full h-full object-cover blur-2xl opacity-30 scale-110"
                  />
                )}
              </div>

              {/* Main Content Container - Instagram Style */}
              <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center">
                {/* Media Container */}
                <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:aspect-[9/16] bg-black md:rounded-xl overflow-hidden shadow-2xl">
                  {/* Main Image/Video */}
                  {reel.media_type === "video" ? (
                    <video
                      ref={(el) => {
                        if (el && index === currentIndex) {
                          // Add error listener
                          el.addEventListener("error", (e) => {
                            console.error(
                              "Video load error:",
                              e,
                              "URL:",
                              reel.media_url
                            );
                          });
                          el.play().catch((err) =>
                            console.log("Autoplay prevented:", err)
                          );
                        } else if (el && index !== currentIndex) {
                          el.pause();
                          el.currentTime = 0;
                        }
                      }}
                      onClick={(e) => {
                        const video = e.target;
                        if (video.paused) {
                          video
                            .play()
                            .catch((err) => console.log("Play error:", err));
                        } else {
                          video.pause();
                        }
                      }}
                      onError={(e) => {
                        console.error("Video error for reel", reel.id, ":", {
                          error: e.target.error,
                          code: e.target.error?.code,
                          message: e.target.error?.message,
                          url: reel.media_url,
                        });
                      }}
                      className="w-full h-full object-contain cursor-pointer"
                      loop
                      playsInline
                      autoPlay
                      preload="auto"
                      crossOrigin="anonymous"
                    >
                      <source
                        src={reel.media_url}
                        type={getVideoMimeType(reel.media_url)}
                      />
                      <p className="text-white text-center p-4">
                        Your browser doesn't support this video format.
                      </p>
                    </video>
                  ) : (
                    <img
                      src={reel.media_url}
                      alt={reel.title}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 pb-4 pointer-events-none">
                    {/* Bottom Info */}
                    <div className="space-y-1 pointer-events-auto bg-gradient-to-t from-black/40 via-black/30 to-transparent p-3 rounded-lg">
                      {/* Title */}
                      <h2 className="text-white text-sm font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-1">
                        {reel.title}
                      </h2>

                      {/* Description */}
                      {reel.description && reel.description !== reel.title && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDescriptions((prev) => {
                              const newSet = new Set(prev);
                              if (newSet.has(reel.id)) {
                                newSet.delete(reel.id);
                              } else {
                                newSet.add(reel.id);
                              }
                              return newSet;
                            });
                          }}
                          className={`text-white/90 text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] cursor-pointer hover:text-white transition-all ${
                            expandedDescriptions.has(reel.id)
                              ? "whitespace-normal break-words"
                              : "line-clamp-1 overflow-hidden text-ellipsis whitespace-nowrap"
                          }`}
                        >
                          {reel.description}
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {reel.tags?.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="text-white/80 text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Username - At Bottom */}
                      <div className="flex items-center gap-2 pt-2">
                        {reel.users?.avatar ? (
                          <img
                            src={reel.users.avatar}
                            alt={reel.users.username || reel.users.name}
                            className="w-6 h-6 rounded-full object-cover shadow-lg border border-white/20"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                            {reel.users?.username?.[0]?.toUpperCase() ||
                              reel.users?.name?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setSelectedUser(reel.users);
                              setShowUserModal(true);
                              setLoadingUserReels(true);

                              // Fetch user's reels
                              try {
                                const response = await fetch(
                                  `/api/reels?userId=${reel.user_id}&limit=100`
                                );
                                const data = await response.json();
                                setUserReels(data.reels || []);
                              } catch (error) {
                                console.error(
                                  "Error fetching user reels:",
                                  error
                                );
                                setUserReels([]);
                              } finally {
                                setLoadingUserReels(false);
                              }
                            }}
                            className="text-white font-semibold text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] hover:text-pink-300 transition-colors cursor-pointer"
                          >
                            @
                            {reel.users?.username ||
                              reel.users?.email?.split("@")[0] ||
                              "user"}
                          </button>

                          {/* User Badge */}
                          {userBadges.has(reel.user_id) &&
                            userBadges.get(reel.user_id).badge && (
                              <span
                                className="text-base"
                                title={`${
                                  userBadges.get(reel.user_id).badge.name
                                } Creator - ${
                                  userBadges.get(reel.user_id).count
                                } reels`}
                              >
                                {userBadges.get(reel.user_id).badge.emoji}
                              </span>
                            )}

                          {/* Follow Button - Only show if not own reel */}
                          {user && reel.user_id !== user.uid && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();

                                // Check if user is logged in
                                if (!user) {
                                  setShowLogin(true);
                                  return;
                                }

                                // Check if user has set username
                                if (!currentUserUsername) {
                                  setShowUsernamePrompt(true);
                                  return;
                                }

                                const isFollowing = followingUsers.has(
                                  reel.user_id
                                );

                                // Add to loading state
                                setFollowLoading((prev) =>
                                  new Set(prev).add(reel.user_id)
                                );

                                try {
                                  if (isFollowing) {
                                    // Unfollow
                                    const response = await fetch(
                                      `/api/followers?followerId=${user.uid}&followingId=${reel.user_id}`,
                                      { method: "DELETE" }
                                    );

                                    if (response.ok) {
                                      setFollowingUsers((prev) => {
                                        const newSet = new Set(prev);
                                        newSet.delete(reel.user_id);
                                        return newSet;
                                      });
                                    }
                                  } else {
                                    // Follow
                                    const response = await fetch(
                                      "/api/followers",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          followerId: user.uid,
                                          followingId: reel.user_id,
                                        }),
                                      }
                                    );

                                    if (response.ok) {
                                      setFollowingUsers((prev) =>
                                        new Set(prev).add(reel.user_id)
                                      );
                                    }
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error toggling follow:",
                                    error
                                  );
                                } finally {
                                  setFollowLoading((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(reel.user_id);
                                    return newSet;
                                  });
                                }
                              }}
                              disabled={followLoading.has(reel.user_id)}
                              className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
                                followingUsers.has(reel.user_id)
                                  ? "bg-white/20 text-white hover:bg-white/30"
                                  : "bg-white text-black hover:bg-white/90"
                              } disabled:opacity-50`}
                            >
                              {followLoading.has(reel.user_id)
                                ? "..."
                                : followingUsers.has(reel.user_id)
                                ? "Following"
                                : "Follow"}
                            </button>
                          )}

                          <span className="text-gray-300 text-xs">•</span>
                          <p className="text-gray-300 text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                            {new Date(reel.created_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons (Right Side) */}
                  <div className="absolute right-4 bottom-20 lg:bottom-32 flex flex-col gap-6 pointer-events-auto">
                    {/* Like Button */}
                    <button
                      onClick={async () => {
                        // Check if user is logged in
                        if (!user) {
                          setShowLogin(true);
                          return;
                        }

                        // Check if user has set username
                        if (!currentUserUsername) {
                          setShowUsernamePrompt(true);
                          return;
                        }

                        const isLiked = likedReels.has(reel.id);

                        // Update UI instantly (optimistic update)
                        if (isLiked) {
                          // Unlike
                          setLikedReels((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(reel.id);
                            return newSet;
                          });
                          setReels((prev) =>
                            prev.map((r) =>
                              r.id === reel.id
                                ? {
                                    ...r,
                                    likes_count: Math.max(
                                      0,
                                      (r.likes_count || 0) - 1
                                    ),
                                  }
                                : r
                            )
                          );
                        } else {
                          // Like
                          setLikedReels((prev) => new Set([...prev, reel.id]));
                          setReels((prev) =>
                            prev.map((r) =>
                              r.id === reel.id
                                ? {
                                    ...r,
                                    likes_count: (r.likes_count || 0) + 1,
                                  }
                                : r
                            )
                          );
                        }

                        // Send request to server
                        try {
                          const response = await fetch(
                            `/api/reels/${reel.id}/like`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: user.uid }),
                            }
                          );

                          if (response.ok) {
                            const data = await response.json();
                            // Update with server response to ensure consistency
                            setReels((prev) =>
                              prev.map((r) =>
                                r.id === reel.id
                                  ? { ...r, likes_count: data.likes_count }
                                  : r
                              )
                            );
                            if (data.liked) {
                              setLikedReels(
                                (prev) => new Set([...prev, reel.id])
                              );
                            } else {
                              setLikedReels((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(reel.id);
                                return newSet;
                              });
                            }
                          } else {
                            // Revert on error
                            if (isLiked) {
                              setLikedReels(
                                (prev) => new Set([...prev, reel.id])
                              );
                              setReels((prev) =>
                                prev.map((r) =>
                                  r.id === reel.id
                                    ? {
                                        ...r,
                                        likes_count: (r.likes_count || 0) + 1,
                                      }
                                    : r
                                )
                              );
                            } else {
                              setLikedReels((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(reel.id);
                                return newSet;
                              });
                              setReels((prev) =>
                                prev.map((r) =>
                                  r.id === reel.id
                                    ? {
                                        ...r,
                                        likes_count: Math.max(
                                          0,
                                          (r.likes_count || 0) - 1
                                        ),
                                      }
                                    : r
                                )
                              );
                            }
                          }
                        } catch (error) {
                          console.error("Error liking reel:", error);
                          // Revert on error
                          if (isLiked) {
                            setLikedReels(
                              (prev) => new Set([...prev, reel.id])
                            );
                            setReels((prev) =>
                              prev.map((r) =>
                                r.id === reel.id
                                  ? {
                                      ...r,
                                      likes_count: (r.likes_count || 0) + 1,
                                    }
                                  : r
                              )
                            );
                          } else {
                            setLikedReels((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(reel.id);
                              return newSet;
                            });
                            setReels((prev) =>
                              prev.map((r) =>
                                r.id === reel.id
                                  ? {
                                      ...r,
                                      likes_count: Math.max(
                                        0,
                                        (r.likes_count || 0) - 1
                                      ),
                                    }
                                  : r
                              )
                            );
                          }
                        }
                      }}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div
                        className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all group-hover:scale-110 ${
                          likedReels.has(reel.id)
                            ? "bg-red-500/20"
                            : "bg-white/10 group-hover:bg-white/20"
                        }`}
                      >
                        <svg
                          className={`w-7 h-7 transition-all duration-200 ${
                            likedReels.has(reel.id)
                              ? "fill-red-500 scale-110"
                              : "fill-none stroke-white stroke-2"
                          }`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                      <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {reel.likes_count || 0}
                      </span>
                    </button>

                    {/* Comment Button */}
                    <button
                      onClick={() => {
                        // Open comments modal (no login required to view)
                        setSelectedReelForComments(reel);
                        setShowCommentsModal(true);
                      }}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-500/30 transition-all group-hover:scale-110">
                        <span className="text-xl">💬</span>
                      </div>
                      <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {reel.comments_count || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="h-screen w-full flex items-center justify-center snap-start">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-sm">Loading more reels...</p>
            </div>
          </div>
        )}
      </div>

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

      {/* Comments Modal */}
      {showCommentsModal && selectedReelForComments && (
        <CommentsModal
          reel={selectedReelForComments}
          currentUserUsername={currentUserUsername}
          onShowUsernamePrompt={() => setShowUsernamePrompt(true)}
          onCommentCountChange={(reelId, newCount) => {
            // Update comment count for specific reel without reloading
            setReels((prev) =>
              prev.map((r) =>
                r.id === reelId ? { ...r, comments_count: newCount } : r
              )
            );
          }}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedReelForComments(null);
          }}
        />
      )}

      {/* Username Prompt Modal */}
      {showUsernamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md p-6 border border-white/10 shadow-2xl">
            {/* Icon */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">👤</span>
              </div>
              <h2 className="text-white text-xl font-bold mb-2">
                Set Your Username
              </h2>
              <p className="text-gray-400 text-sm">
                For reels posting, commenting, and liking you have to set your
                username. Once set, it cannot be changed.
              </p>
            </div>

            {/* Username Input */}
            <div className="mb-4">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setUsernameError("");
                }}
                placeholder="Enter your username (cannot be changed later)"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={savingUsername}
              />
              {usernameError && (
                <p className="text-red-400 text-sm mt-2">{usernameError}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={async () => {
                  if (!usernameInput.trim()) {
                    setUsernameError("Please enter a username");
                    return;
                  }

                  if (usernameInput.length < 3) {
                    setUsernameError("Username must be at least 3 characters");
                    return;
                  }

                  setSavingUsername(true);
                  setUsernameError("");

                  try {
                    const response = await fetch("/api/username", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: user.uid,
                        username: usernameInput.trim(),
                      }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                      setCurrentUserUsername(usernameInput.trim());
                      setShowUsernamePrompt(false);
                      setUsernameInput("");
                    } else {
                      setUsernameError(data.error || "Failed to save username");
                    }
                  } catch (error) {
                    console.error("Error saving username:", error);
                    setUsernameError(
                      "Failed to save username. Please try again."
                    );
                  } finally {
                    setSavingUsername(false);
                  }
                }}
                disabled={savingUsername}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingUsername ? "Saving..." : "Save Username"}
              </button>
              <button
                onClick={() => {
                  setShowUsernamePrompt(false);
                  setUsernameInput("");
                  setUsernameError("");
                }}
                disabled={savingUsername}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Reel Modal */}
      {showUploadModal && (
        <UploadReelModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            // Refresh reels after successful upload
            setPage(1);
            fetchReels(1, false);
          }}
        />
      )}

      {/* User Profile Modal */}
      {showUserModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => {
            setShowUserModal(false);
            setSelectedUser(null);
            setUserReels([]);
          }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowUserModal(false);
                setSelectedUser(null);
                setUserReels([]);
              }}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* User Header */}
            <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-b border-white/10 p-6">
              <div className="flex items-center gap-4">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.username || selectedUser.name}
                    className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-white/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {selectedUser.username?.[0]?.toUpperCase() ||
                      selectedUser.name?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white text-2xl font-bold">
                      @
                      {selectedUser.username ||
                        selectedUser.email?.split("@")[0] ||
                        "user"}
                    </h2>
                    {/* User Badge in Modal */}
                    {userReels.length > 0 &&
                      (() => {
                        const badge = getBadgeForReelCount(userReels.length);
                        return badge ? (
                          <span
                            className="text-xl"
                            title={`${badge.name} Creator - ${userReels.length} reels`}
                          >
                            {badge.emoji}
                          </span>
                        ) : null;
                      })()}
                  </div>
                  <p className="text-white/80 text-sm mt-1">
                    {userReels.length}{" "}
                    {userReels.length === 1 ? "Reel" : "Reels"}
                  </p>
                </div>
              </div>
            </div>

            {/* User Reels Grid */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              {loadingUserReels ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : userReels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">No reels posted yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {userReels.map((reel) => (
                    <div
                      key={reel.id}
                      className="group cursor-pointer"
                      onClick={() => {
                        // Close user modal and scroll to this reel in main view
                        setShowUserModal(false);
                        setSelectedUser(null);
                        const reelIndex = reels.findIndex(
                          (r) => r.id === reel.id
                        );
                        if (reelIndex !== -1) {
                          scrollToReel(reelIndex);
                        }
                      }}
                    >
                      <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black">
                        {reel.media_type === "video" ? (
                          <video
                            className="w-full h-full object-contain"
                            muted
                            playsInline
                          >
                            <source
                              src={reel.media_url}
                              type={getVideoMimeType(reel.media_url)}
                            />
                          </video>
                        ) : (
                          <img
                            src={reel.media_url}
                            alt={reel.title}
                            className="w-full h-full object-contain"
                          />
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center p-2">
                            <p className="font-semibold text-sm mb-2 line-clamp-2">
                              {reel.title}
                            </p>
                            <div className="flex items-center justify-center gap-3 text-xs">
                              <span>❤️ {reel.likes_count || 0}</span>
                              <span>💬 {reel.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Smooth scroll behavior */
        @media (prefers-reduced-motion: no-preference) {
          .overflow-y-scroll {
            scroll-behavior: smooth;
            scroll-padding: 0;
          }
        }

        /* Better snap scrolling */
        .snap-y {
          scroll-snap-type: y mandatory;
        }

        .snap-start {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }

        @keyframes like-pulse {
          0% {
            transform: scale(1);
            background-color: rgba(255, 255, 255, 0.2);
          }
          50% {
            transform: scale(1.3);
            background-color: rgba(236, 72, 153, 0.5);
          }
          100% {
            transform: scale(1);
            background-color: rgba(255, 255, 255, 0.2);
          }
        }

        @keyframes like-bounce {
          0%,
          100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3) rotate(-10deg);
          }
          50% {
            transform: scale(1.4) rotate(10deg);
          }
          75% {
            transform: scale(1.3) rotate(-5deg);
          }
        }

        .animate-like-pulse {
          animation: like-pulse 0.6s ease-out;
        }

        .animate-like-bounce {
          animation: like-bounce 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
