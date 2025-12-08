"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import CommentsModal from "@/components/CommentsModal";
import UploadReelModal from "@/components/UploadReelModal";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import EventHubLogo from "@/components/EventHubLogo";
import { supabase } from "@/lib/supabase";

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
  const searchParams = useSearchParams();
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showReelViewerModal, setShowReelViewerModal] = useState(false);
  const [selectedReelForViewer, setSelectedReelForViewer] = useState(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState({});
  const lastTapTime = useRef({});
  const isDoubleTapProcessing = useRef({});
  const [copiedReelId, setCopiedReelId] = useState(null);
  const [showUserProfileCard, setShowUserProfileCard] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const userProfileCardRef = useRef(null);
  const REELS_PER_PAGE = 20;

  // Auto-pause videos when any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      showCommentsModal ||
      showUserModal ||
      showReelViewerModal ||
      showLogin ||
      showSignup ||
      showUsernamePrompt ||
      showUploadModal ||
      showSearchModal;

    if (isAnyModalOpen) {
      // Pause all videos
      const videos = document.querySelectorAll("video");
      videos.forEach((video) => {
        if (!video.paused) {
          video.pause();
          video.dataset.wasPausedByModal = "true";
        }
      });
    } else {
      // Resume the current video only
      const videos = document.querySelectorAll("video");
      videos.forEach((video, index) => {
        if (
          video.dataset.wasPausedByModal === "true" &&
          index === currentIndex
        ) {
          video.play().catch(() => {});
          delete video.dataset.wasPausedByModal;
        } else {
          delete video.dataset.wasPausedByModal;
        }
      });
    }
  }, [
    showCommentsModal,
    showUserModal,
    showReelViewerModal,
    showLogin,
    showSignup,
    showUsernamePrompt,
    showUploadModal,
    showSearchModal,
    currentIndex,
  ]);

  // Fetch user stats when selectedUser changes
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!selectedUser?.id) {
        setFollowersCount(0);
        return;
      }

      try {
        // Fetch followers count
        const { count: followersCount } = await supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("following_id", selectedUser.id);

        setFollowersCount(followersCount || 0);
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setFollowersCount(0);
      }
    };

    fetchUserStats();
  }, [selectedUser]);

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

  // Search users by username
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/users/search?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.users || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // View user's reels from search
  const viewUserReelsFromSearch = async (userData) => {
    setSelectedUser(userData);
    setLoadingUserReels(true);
    setShowSearchModal(false);

    try {
      const response = await fetch(`/api/reels?userId=${userData.id}`);
      const data = await response.json();
      if (response.ok) {
        setUserReels(data.reels || []);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error("Error fetching user reels:", error);
      setUserReels([]);
    } finally {
      setLoadingUserReels(false);
    }
  };

  // Pause background reel when modal is open
  useEffect(() => {
    const currentVideo = document.querySelector(
      `video[data-index="${currentIndex}"]`
    );

    if (showReelViewerModal || showUserModal || showSearchModal) {
      // Pause the current background video when any modal is open
      if (currentVideo) {
        currentVideo.pause();
      }
    } else {
      // Resume playing when modals are closed
      if (currentVideo) {
        currentVideo.play().catch((err) => {
          console.log("Auto-play prevented:", err);
        });
      }
    }
  }, [showReelViewerModal, showUserModal, showSearchModal, currentIndex]);

  // Check URL for user parameter and open their profile
  useEffect(() => {
    const username = searchParams.get("user");
    const reelId = searchParams.get("reel");

    if (username) {
      // Fetch user data and reels
      const fetchUserProfile = async () => {
        try {
          // Fetch user by username
          const userResponse = await fetch(`/api/users?username=${username}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData) {
              setSelectedUser(userData);
              setShowUserModal(true);

              // Fetch their reels
              setLoadingUserReels(true);
              const reelsResponse = await fetch(
                `/api/reels/user/${userData.id}`
              );
              if (reelsResponse.ok) {
                const reelsData = await reelsResponse.json();
                setUserReels(reelsData);
              }
              setLoadingUserReels(false);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setLoadingUserReels(false);
        }
      };

      fetchUserProfile();
    } else if (reelId) {
      // Open specific reel in viewer
      const openSharedReel = async () => {
        try {
          // Find the reel in current reels or fetch it
          let targetReel = reels.find((r) => r.id === reelId);

          if (targetReel) {
            setSelectedReelForViewer(targetReel);
            setShowReelViewerModal(true);
          } else {
            // Fetch the specific reel if not in current list
            const response = await fetch(`/api/reels/${reelId}`);
            if (response.ok) {
              const reelData = await response.json();
              setSelectedReelForViewer(reelData);
              setShowReelViewerModal(true);
            }
          }
        } catch (error) {
          console.error("Error fetching shared reel:", error);
        }
      };

      openSharedReel();
    }
  }, [searchParams, reels]);

  // Handle double tap/click to like
  const handleDoubleTapLike = async (reelId) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    const isAlreadyLiked = likedReels.has(reelId);

    // Show animation
    setShowLikeAnimation((prev) => ({ ...prev, [reelId]: true }));
    setTimeout(() => {
      setShowLikeAnimation((prev) => ({ ...prev, [reelId]: false }));
    }, 1000);

    // If already liked, don't unlike on double tap
    if (isAlreadyLiked) {
      return;
    }

    // Add to liked reels immediately for UI feedback
    setLikedReels((prev) => new Set(prev).add(reelId));

    // Update like count in UI
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, likes_count: (r.likes_count || 0) + 1 } : r
      )
    );

    // Make API call
    try {
      const response = await fetch(`/api/reels/${reelId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setLikedReels((prev) => {
          const newSet = new Set(prev);
          newSet.delete(reelId);
          return newSet;
        });
        setReels((prev) =>
          prev.map((r) =>
            r.id === reelId
              ? { ...r, likes_count: (r.likes_count || 1) - 1 }
              : r
          )
        );
      }
    } catch (error) {
      console.error("Error liking reel:", error);
      // Revert on error
      setLikedReels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reelId);
        return newSet;
      });
      setReels((prev) =>
        prev.map((r) =>
          r.id === reelId ? { ...r, likes_count: (r.likes_count || 1) - 1 } : r
        )
      );
    }
  };

  // Handle share reel
  const handleShare = async (reelId) => {
    // Create shareable URL with reel ID as query parameter
    const reelUrl = `${window.location.origin}/reels?reel=${reelId}`;

    try {
      await navigator.clipboard.writeText(reelUrl);
      setCopiedReelId(reelId);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedReelId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // Handle download user profile card
  const handleDownloadUserCard = async () => {
    if (!userProfileCardRef.current || !selectedUser) return;

    try {
      const html2canvas = (await import("html2canvas")).default;

      // Wait for all images to load
      const images = userProfileCardRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = resolve; // Still resolve even on error to continue
            // Timeout after 5 seconds
            setTimeout(resolve, 5000);
          });
        })
      );

      const canvas = await html2canvas(userProfileCardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        removeContainer: true,
        foreignObjectRendering: false,
      });

      const link = document.createElement("a");
      link.download = `${
        selectedUser.username || selectedUser.display_name || "user"
      }-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error generating card:", error);
      alert("Failed to download card. Please try again.");
    }
  };

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

          {/* Search and Upload Buttons - Only show when user is logged in */}
          {user && (
            <>
              <button
                onClick={() => setShowSearchModal(true)}
                className="absolute top-3 right-16 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all z-10"
                title="Find Users"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <button
                onClick={handleUploadClick}
                className="absolute top-3 right-4 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg hover:scale-110 transition-all z-10"
                title="Upload Reel"
              >
                +
              </button>
            </>
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
                      data-index={index}
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
                        const now = Date.now();
                        const reelId = reel.id;
                        const lastTap = lastTapTime.current[reelId] || 0;
                        const timeSinceLastTap = now - lastTap;

                        // Ignore clicks that happen right after a double-tap
                        if (isDoubleTapProcessing.current[reelId]) {
                          return;
                        }

                        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                          // Double tap detected
                          handleDoubleTapLike(reelId);
                          lastTapTime.current[reelId] = 0;
                          // Set flag to prevent next click from processing
                          isDoubleTapProcessing.current[reelId] = true;
                          setTimeout(() => {
                            isDoubleTapProcessing.current[reelId] = false;
                          }, 400);
                        } else {
                          // Single tap - play/pause video
                          const video = e.target;
                          if (video.paused) {
                            video
                              .play()
                              .catch((err) => console.log("Play error:", err));
                          } else {
                            video.pause();
                          }
                          lastTapTime.current[reelId] = now;
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
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={(e) => {
                        const now = Date.now();
                        const reelId = reel.id;
                        const lastTap = lastTapTime.current[reelId] || 0;
                        const timeSinceLastTap = now - lastTap;

                        // Ignore clicks that happen right after a double-tap
                        if (isDoubleTapProcessing.current[reelId]) {
                          return;
                        }

                        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                          // Double tap detected
                          handleDoubleTapLike(reelId);
                          lastTapTime.current[reelId] = 0;
                          // Set flag to prevent next click from processing
                          isDoubleTapProcessing.current[reelId] = true;
                          setTimeout(() => {
                            isDoubleTapProcessing.current[reelId] = false;
                          }, 400);
                        } else {
                          // Single tap - just record the tap time
                          lastTapTime.current[reelId] = now;
                        }
                      }}
                    />
                  )}

                  {/* Like Animation Heart */}
                  {showLikeAnimation[reel.id] && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="animate-like-burst">
                        <svg
                          className="w-32 h-32 text-white drop-shadow-2xl"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                    </div>
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
                    {/* Share Button */}
                    <button
                      onClick={() => handleShare(reel.id)}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-green-500/30 transition-all group-hover:scale-110">
                        {copiedReelId === reel.id ? (
                          <svg
                            className="w-6 h-6 text-green-400"
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
                        ) : (
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {copiedReelId === reel.id ? "Copied!" : "Share"}
                      </span>
                    </button>

                    {/* Like Button */}
                    <button
                      onClick={async () => {
                        // Ignore clicks during double-tap processing
                        if (isDoubleTapProcessing.current[reel.id]) {
                          return;
                        }

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
          zIndex={9999}
          onCommentCountChange={(reelId, newCount) => {
            // Update comment count for specific reel without reloading
            setReels((prev) =>
              prev.map((r) =>
                r.id === reelId ? { ...r, comments_count: newCount } : r
              )
            );
            // Update user reels if in user modal
            setUserReels((prev) =>
              prev.map((r) =>
                r.id === reelId ? { ...r, comments_count: newCount } : r
              )
            );
            // Update viewer modal if open
            if (selectedReelForViewer?.id === reelId) {
              setSelectedReelForViewer((prev) => ({
                ...prev,
                comments_count: newCount,
              }));
            }
            // Update selected reel for comments
            setSelectedReelForComments((prev) => ({
              ...prev,
              comments_count: newCount,
            }));
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

      {/* Search Users Modal */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => {
            setShowSearchModal(false);
            setSearchQuery("");
            setSearchResults([]);
          }}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] flex flex-col border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Find Users</h3>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-white/60 hover:text-white transition-colors"
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
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Search by username..."
                  className="w-full bg-white/10 text-white placeholder-white/50 px-4 py-3 pl-10 rounded-lg border border-white/20 focus:border-cyan-400 focus:outline-none transition-colors"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-white/50"
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
              </div>
            </div>

            {/* Search Results */}
            <div className="overflow-y-auto flex-1">
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <p className="text-white/60 text-center py-8">No users found</p>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => viewUserReelsFromSearch(user)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username || "User"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400/50"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-cyan-400/50"
                        style={{ display: user.avatar ? "none" : "flex" }}
                      >
                        {(user.username || user.email || "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white font-semibold">
                          {user.username || "Anonymous"}
                        </div>
                        {user.name && (
                          <div className="text-white/60 text-sm">
                            {user.name}
                          </div>
                        )}
                      </div>
                      <svg
                        className="w-5 h-5 text-white/40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 mx-auto text-white/20 mb-3"
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
                  <p className="text-white/60 text-sm">
                    Search for users by their username
                  </p>
                </div>
              )}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4"
          onClick={() => {
            setShowUserModal(false);
            setSelectedUser(null);
            setUserReels([]);
          }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-gradient-to-br from-gray-900 to-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowUserModal(false);
                setSelectedUser(null);
                setUserReels([]);
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
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

            {/* Download Button */}
            <button
              onClick={handleDownloadUserCard}
              className="absolute top-3 right-14 sm:top-4 sm:right-16 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
              title="Download Profile Card"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>

            {/* User Header */}
            <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-b border-white/10 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.username || selectedUser.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shadow-lg border-2 border-white/20"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg">
                    {selectedUser.username?.[0]?.toUpperCase() ||
                      selectedUser.name?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white text-xl sm:text-2xl font-bold truncate">
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
                            className="text-lg sm:text-xl flex-shrink-0"
                            title={`${badge.name} Creator - ${userReels.length} reels`}
                          >
                            {badge.emoji}
                          </span>
                        ) : null;
                      })()}
                  </div>
                  <p className="text-white/80 text-xs sm:text-sm mt-1">
                    {userReels.length}{" "}
                    {userReels.length === 1 ? "Reel" : "Reels"}
                  </p>

                  {/* Follow Button */}
                  {user && selectedUser.id !== user.uid && (
                    <button
                      onClick={async () => {
                        if (!user) {
                          setShowLogin(true);
                          return;
                        }

                        if (!currentUserUsername) {
                          setShowUsernamePrompt(true);
                          return;
                        }

                        const isFollowing = followingUsers.has(selectedUser.id);
                        setFollowLoading((prev) =>
                          new Set(prev).add(selectedUser.id)
                        );

                        try {
                          if (isFollowing) {
                            const response = await fetch(
                              `/api/followers?followerId=${user.uid}&followingId=${selectedUser.id}`,
                              { method: "DELETE" }
                            );

                            if (response.ok) {
                              setFollowingUsers((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(selectedUser.id);
                                return newSet;
                              });
                            }
                          } else {
                            const response = await fetch("/api/followers", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                followerId: user.uid,
                                followingId: selectedUser.id,
                              }),
                            });

                            if (response.ok) {
                              setFollowingUsers((prev) =>
                                new Set(prev).add(selectedUser.id)
                              );
                            }
                          }
                        } catch (error) {
                          console.error("Error toggling follow:", error);
                        } finally {
                          setFollowLoading((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(selectedUser.id);
                            return newSet;
                          });
                        }
                      }}
                      disabled={followLoading.has(selectedUser.id)}
                      className={`mt-2 sm:mt-3 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold transition-all ${
                        followingUsers.has(selectedUser.id)
                          ? "bg-white/20 text-white hover:bg-white/30 border border-white/30"
                          : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                      } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                    >
                      {followLoading.has(selectedUser.id)
                        ? "Loading..."
                        : followingUsers.has(selectedUser.id)
                        ? "Following"
                        : "Follow"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* User Reels Grid */}
            <div className="overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-180px)] p-3 sm:p-6">
              {loadingUserReels ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : userReels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60 text-sm sm:text-base">
                    No reels posted yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {userReels.map((reel) => (
                    <div
                      key={reel.id}
                      className="group cursor-pointer"
                      onClick={() => {
                        setSelectedReelForViewer(reel);
                        setShowReelViewerModal(true);
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

            {/* Hidden Profile Card for Download */}
            <div
              ref={userProfileCardRef}
              style={{
                position: "fixed",
                left: "-9999px",
                top: "-9999px",
                width: "380px",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)",
                  padding: "4px",
                  borderRadius: "24px",
                }}
              >
                {/* Card Content */}
                <div
                  style={{
                    background: "white",
                    borderRadius: "20px",
                    padding: "32px 24px",
                  }}
                >
                  {/* User Avatar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    {selectedUser?.avatar ? (
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)",
                          padding: "3px",
                          borderRadius: "50%",
                          width: "108px",
                          height: "108px",
                        }}
                      >
                        <img
                          src={selectedUser.avatar}
                          alt={
                            selectedUser.username || selectedUser.display_name
                          }
                          style={{
                            width: "102px",
                            height: "102px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            display: "block",
                            background: "white",
                          }}
                          crossOrigin="anonymous"
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "108px",
                          height: "108px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "42px",
                        }}
                      >
                        {selectedUser?.username?.[0]?.toUpperCase() ||
                          selectedUser?.display_name?.[0]?.toUpperCase() ||
                          "U"}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <h3
                      style={{
                        color: "#1f2937",
                        fontWeight: "700",
                        fontSize: "22px",
                        marginBottom: "6px",
                        wordWrap: "break-word",
                      }}
                    >
                      {selectedUser?.display_name ||
                        selectedUser?.username ||
                        "User"}
                    </h3>

                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: "15px",
                        marginBottom: "20px",
                        wordWrap: "break-word",
                      }}
                    >
                      @{selectedUser?.username || "username"}
                    </p>

                    {/* Stats */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "40px",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            color: "#ec4899",
                            fontWeight: "700",
                            fontSize: "18px",
                            marginBottom: "4px",
                          }}
                        >
                          {userReels.length}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            fontWeight: "400",
                          }}
                        >
                          Reels
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            color: "#a855f7",
                            fontWeight: "700",
                            fontSize: "18px",
                            marginBottom: "4px",
                          }}
                        >
                          {followersCount}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            fontWeight: "400",
                          }}
                        >
                          Followers
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  {userReels.length > 0 &&
                    (() => {
                      const badge = getBadgeForReelCount(userReels.length);
                      return badge ? (
                        <div
                          style={{
                            background: "#fef3f9",
                            borderRadius: "12px",
                            padding: "12px",
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "24px" }}>
                            {badge.emoji}
                          </span>
                          <span
                            style={{
                              color: "#831843",
                              fontWeight: "700",
                              fontSize: "16px",
                            }}
                          >
                            {badge.name} Creator
                          </span>
                        </div>
                      ) : null;
                    })()}

                  {/* QR Code */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "24px",
                    }}
                  >
                    <QRCodeSVG
                      value={`https://eventhubx.site/u/${
                        selectedUser?.username || "user"
                      }`}
                      size={100}
                      level="H"
                      includeMargin={false}
                      fgColor="#1f2937"
                      bgColor="#ffffff"
                    />
                  </div>

                  {/* EventHub Branding */}
                  <div
                    style={{
                      textAlign: "center",
                      paddingTop: "20px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background:
                            "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "18px",
                          }}
                        >
                          E
                        </span>
                      </div>
                      <span
                        style={{
                          color: "#1f2937",
                          fontWeight: "700",
                          fontSize: "22px",
                        }}
                      >
                        EventHub
                      </span>
                    </div>
                    <p
                      style={{
                        color: "#374151",
                        fontSize: "13px",
                        marginBottom: "4px",
                        fontWeight: "600",
                      }}
                    >
                      eventhubx.site/u/{selectedUser?.username || "username"}
                    </p>
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "12px",
                        fontWeight: "400",
                      }}
                    >
                      Scan to connect with me!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reel Viewer Modal */}
      {showReelViewerModal && selectedReelForViewer && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={() => {
            setShowReelViewerModal(false);
            setSelectedReelForViewer(null);
          }}
        >
          <div
            className="relative w-full max-w-md max-h-[90vh] bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowReelViewerModal(false);
                setSelectedReelForViewer(null);
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

            {/* Reel Content */}
            <div className="relative aspect-[9/16] bg-black">
              {selectedReelForViewer.media_type === "video" ? (
                <video
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                  playsInline
                >
                  <source
                    src={selectedReelForViewer.media_url}
                    type={getVideoMimeType(selectedReelForViewer.media_url)}
                  />
                </video>
              ) : (
                <img
                  src={selectedReelForViewer.media_url}
                  alt={selectedReelForViewer.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Reel Info Overlay - Left Side */}
              <div className="absolute bottom-40 left-0 right-20 p-6 pointer-events-none max-w-[50%]">
                <h3 className="text-white font-bold text-base mb-2 drop-shadow-2xl leading-tight">
                  {selectedReelForViewer.title}
                </h3>
                {selectedReelForViewer.description && (
                  <p className="text-white text-sm mb-1 drop-shadow-lg leading-relaxed whitespace-pre-wrap">
                    {selectedReelForViewer.description}
                  </p>
                )}
              </div>

              {/* Action Buttons - Right Side */}
              <div className="absolute bottom-40 right-4 flex flex-col gap-4 items-center">
                {/* Like Button */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!user) {
                      setShowLogin(true);
                      return;
                    }

                    if (!currentUserUsername) {
                      setShowUsernamePrompt(true);
                      return;
                    }

                    const isLiked = likedReels.has(selectedReelForViewer.id);

                    // Update UI instantly (optimistic update)
                    if (isLiked) {
                      // Unlike
                      setLikedReels((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(selectedReelForViewer.id);
                        return newSet;
                      });
                      setSelectedReelForViewer((prev) => ({
                        ...prev,
                        likes_count: Math.max(0, (prev.likes_count || 0) - 1),
                      }));
                      setUserReels((prev) =>
                        prev.map((r) =>
                          r.id === selectedReelForViewer.id
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
                      setLikedReels(
                        (prev) => new Set([...prev, selectedReelForViewer.id])
                      );
                      setSelectedReelForViewer((prev) => ({
                        ...prev,
                        likes_count: (prev.likes_count || 0) + 1,
                      }));
                      setUserReels((prev) =>
                        prev.map((r) =>
                          r.id === selectedReelForViewer.id
                            ? { ...r, likes_count: (r.likes_count || 0) + 1 }
                            : r
                        )
                      );
                    }

                    // Send request to server
                    try {
                      const response = await fetch(
                        `/api/reels/${selectedReelForViewer.id}/like`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: user.uid }),
                        }
                      );

                      if (response.ok) {
                        const data = await response.json();
                        // Update with server response to ensure consistency
                        setSelectedReelForViewer((prev) => ({
                          ...prev,
                          likes_count: data.likes_count,
                        }));
                        setUserReels((prev) =>
                          prev.map((r) =>
                            r.id === selectedReelForViewer.id
                              ? { ...r, likes_count: data.likes_count }
                              : r
                          )
                        );
                        if (data.liked) {
                          setLikedReels(
                            (prev) =>
                              new Set([...prev, selectedReelForViewer.id])
                          );
                        } else {
                          setLikedReels((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(selectedReelForViewer.id);
                            return newSet;
                          });
                        }
                      } else {
                        // Revert on error
                        if (isLiked) {
                          setLikedReels(
                            (prev) =>
                              new Set([...prev, selectedReelForViewer.id])
                          );
                          setSelectedReelForViewer((prev) => ({
                            ...prev,
                            likes_count: (prev.likes_count || 0) + 1,
                          }));
                          setUserReels((prev) =>
                            prev.map((r) =>
                              r.id === selectedReelForViewer.id
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
                            newSet.delete(selectedReelForViewer.id);
                            return newSet;
                          });
                          setSelectedReelForViewer((prev) => ({
                            ...prev,
                            likes_count: Math.max(
                              0,
                              (prev.likes_count || 0) - 1
                            ),
                          }));
                          setUserReels((prev) =>
                            prev.map((r) =>
                              r.id === selectedReelForViewer.id
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
                      console.error("Error toggling like:", error);
                      // Revert on error
                      if (isLiked) {
                        setLikedReels(
                          (prev) => new Set([...prev, selectedReelForViewer.id])
                        );
                        setSelectedReelForViewer((prev) => ({
                          ...prev,
                          likes_count: (prev.likes_count || 0) + 1,
                        }));
                        setUserReels((prev) =>
                          prev.map((r) =>
                            r.id === selectedReelForViewer.id
                              ? { ...r, likes_count: (r.likes_count || 0) + 1 }
                              : r
                          )
                        );
                      } else {
                        setLikedReels((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(selectedReelForViewer.id);
                          return newSet;
                        });
                        setSelectedReelForViewer((prev) => ({
                          ...prev,
                          likes_count: Math.max(0, (prev.likes_count || 0) - 1),
                        }));
                        setUserReels((prev) =>
                          prev.map((r) =>
                            r.id === selectedReelForViewer.id
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
                  className="flex flex-col items-center gap-1 pointer-events-auto group"
                >
                  <div
                    className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all group-hover:scale-110 ${
                      likedReels.has(selectedReelForViewer.id)
                        ? "bg-red-500/20"
                        : "bg-white/10 group-hover:bg-white/20"
                    }`}
                  >
                    <svg
                      className={`w-7 h-7 transition-all duration-200 ${
                        likedReels.has(selectedReelForViewer.id)
                          ? "fill-red-500 scale-110"
                          : "fill-none stroke-white stroke-2"
                      }`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    {selectedReelForViewer.likes_count || 0}
                  </span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReelForComments(selectedReelForViewer);
                    setShowCommentsModal(true);
                  }}
                  className="flex flex-col items-center gap-1 pointer-events-auto group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-500/30 transition-all group-hover:scale-110">
                    <span className="text-xl">💬</span>
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    {selectedReelForViewer.comments_count || 0}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(selectedReelForViewer.id);
                  }}
                  className="flex flex-col items-center gap-1 pointer-events-auto"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all">
                    {copiedReelId === selectedReelForViewer.id ? (
                      <svg
                        className="w-6 h-6 text-green-400"
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
                    ) : (
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    Share
                  </span>
                </button>
              </div>
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

        @keyframes like-burst {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          15% {
            transform: scale(1.2);
            opacity: 1;
          }
          30% {
            transform: scale(0.95);
          }
          45%,
          80% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        .animate-like-burst {
          animation: like-burst 1s ease-out;
        }
      `}</style>
    </div>
  );
}
