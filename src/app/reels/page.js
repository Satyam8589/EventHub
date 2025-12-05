"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import CommentsModal from "@/components/CommentsModal";

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
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState(new Set());
  const REELS_PER_PAGE = 20;

  // Fetch reels from database with pagination
  const fetchReels = useCallback(async (pageNum = 1, append = false) => {
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
          setReels(prev => [...prev, ...newReels]);
        } else {
          setReels(newReels);
        }
        
        // Check if there are more reels to load
        setHasMore(newReels.length === REELS_PER_PAGE);
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
  }, [selectedTag]);

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

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / containerHeight);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
        setCurrentIndex(newIndex);
      }

      // Load more reels when approaching the end (within last 3 reels)
      if (
        newIndex >= reels.length - 3 &&
        hasMore &&
        !loadingMore &&
        !loading
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchReels(nextPage, true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, reels.length, hasMore, loadingMore, loading, page, fetchReels]);

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

  // Handle scroll/swipe navigation
  const scrollToReel = useCallback((index) => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      containerRef.current.scrollTo({
        top: index * containerHeight,
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
        className="mt-32 lg:mt-16 h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ 
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth"
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
              style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
            >
              {/* Background Blur (for desktop) */}
              <div className="absolute inset-0 overflow-hidden">
                {reel.media_type === "video" ? (
                  <video
                    src={reel.media_url}
                    className="w-full h-full object-cover blur-2xl opacity-30 scale-110"
                    muted
                    playsInline
                  />
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
                          el.play().catch(err => console.log("Autoplay prevented:", err));
                        } else if (el && index !== currentIndex) {
                          el.pause();
                          el.currentTime = 0;
                        }
                      }}
                      onClick={(e) => {
                        const video = e.target;
                        if (video.paused) {
                          video.play();
                        } else {
                          video.pause();
                        }
                      }}
                      src={reel.media_url}
                      className="w-full h-full object-contain cursor-pointer"
                      loop
                      playsInline
                    />
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
                        <p 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDescriptions(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(reel.id)) {
                                newSet.delete(reel.id);
                              } else {
                                newSet.add(reel.id);
                              }
                              return newSet;
                            });
                          }}
                          className={`text-white/90 text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] cursor-pointer hover:text-white transition-colors ${
                            expandedDescriptions.has(reel.id) ? '' : 'line-clamp-1 overflow-hidden text-ellipsis'
                          }`}
                        >
                          {reel.description}
                        </p>
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
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                          {reel.users?.username?.[0]?.toUpperCase() || reel.users?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setSelectedUser(reel.users);
                              setShowUserModal(true);
                              setLoadingUserReels(true);
                              
                              // Fetch user's reels
                              try {
                                const response = await fetch(`/api/reels?userId=${reel.user_id}&limit=100`);
                                const data = await response.json();
                                setUserReels(data.reels || []);
                              } catch (error) {
                                console.error("Error fetching user reels:", error);
                                setUserReels([]);
                              } finally {
                                setLoadingUserReels(false);
                              }
                            }}
                            className="text-white font-semibold text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] hover:text-pink-300 transition-colors cursor-pointer"
                          >
                            @{reel.users?.username || reel.users?.email?.split("@")[0] || "user"}
                          </button>
                          <span className="text-gray-300 text-xs">•</span>
                          <p className="text-gray-300 text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                            {new Date(reel.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons (Right Side) */}
                  <div className="absolute right-4 bottom-32 flex flex-col gap-6 pointer-events-auto">
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
                          alert("Please set your username in your profile before liking reels!");
                          return;
                        }
                        
                        try {
                          const response = await fetch(`/api/reels/${reel.id}/like`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: user.uid }),
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            // Update local state
                            setReels(prev => prev.map(r => 
                              r.id === reel.id 
                                ? { ...r, likes_count: data.likes_count }
                                : r
                            ));
                            
                            // Trigger like animation
                            setLikedReels(prev => new Set(prev).add(reel.id));
                            setTimeout(() => {
                              setLikedReels(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(reel.id);
                                return newSet;
                              });
                            }, 1000);
                          }
                        } catch (error) {
                          console.error("Error liking reel:", error);
                        }
                      }}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-pink-500/30 transition-all group-hover:scale-110 ${
                        likedReels.has(reel.id) ? 'animate-like-pulse' : ''
                      }`}>
                        <span className={`text-xl transition-transform ${
                          likedReels.has(reel.id) ? 'animate-like-bounce' : ''
                        }`}>❤️</span>
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
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedReelForComments(null);
            // Refresh reels to update comment count
            fetchReels();
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* User Header */}
            <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-b border-white/10 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selectedUser.username?.[0]?.toUpperCase() || selectedUser.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-white text-2xl font-bold">
                    @{selectedUser.username || selectedUser.email?.split("@")[0] || "user"}
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    {userReels.length} {userReels.length === 1 ? 'Reel' : 'Reels'}
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
                        const reelIndex = reels.findIndex(r => r.id === reel.id);
                        if (reelIndex !== -1) {
                          scrollToReel(reelIndex);
                        }
                      }}
                    >
                      <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-black">
                        {reel.media_type === "video" ? (
                          <video
                            src={reel.media_url}
                            className="w-full h-full object-contain"
                            muted
                          />
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
                            <p className="font-semibold text-sm mb-2 line-clamp-2">{reel.title}</p>
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
          0%, 100% {
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
