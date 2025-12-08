"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TicketModal from "@/components/TicketModal";
import EventHubLogo from "@/components/EventHubLogo";
import UploadReelModal from "@/components/UploadReelModal";
import CommentsModal from "@/components/CommentsModal";

export default function ProfilePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
  });
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [userReels, setUserReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [deletingReelId, setDeletingReelId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReelModal, setShowReelModal] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedReelForComments, setSelectedReelForComments] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [showUserReelsModal, setShowUserReelsModal] = useState(false);
  const [selectedUserReels, setSelectedUserReels] = useState([]);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [loadingUserReels, setLoadingUserReels] = useState(false);
  const [likedReels, setLikedReels] = useState(new Set());

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

        const cacheBuster = Date.now();
        const response = await fetch(
          `/api/bookings?userId=${user.uid}&_=${cacheBuster}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          setBookings([]);
          return;
        }

        if (response.ok) {
          const allBookings = data.bookings || [];
          setBookings(allBookings);

          // Calculate statistics
          const now = new Date(); // Current time in UTC

          // Helper to parse UTC dates
          const parseEventDate = (dateStr) => {
            if (!dateStr) return null;
            if (dateStr.includes("T") && dateStr.includes("Z")) {
              return new Date(dateStr);
            } else if (dateStr.includes("T")) {
              return new Date(dateStr + "Z");
            } else {
              return new Date(dateStr.replace(" ", "T") + "Z");
            }
          };

          const stats = {
            total: allBookings.length,
            upcoming: allBookings.filter((booking) => {
              const eventDate = parseEventDate(booking.event?.date);
              return (
                eventDate && eventDate >= now && booking.status === "CONFIRMED"
              );
            }).length,
            completed: allBookings.filter((booking) => {
              const eventDate = parseEventDate(booking.event?.date);
              return (
                eventDate && eventDate < now && booking.status === "CONFIRMED"
              );
            }).length,
          };
          setBookingStats(stats);
        } else {
          console.error("Failed to fetch bookings:", data);
          setBookings([]);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  // Fetch username
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/username?userId=${user.uid}`);
        const data = await response.json();

        if (data.username) {
          setUsername(data.username);
          setUsernameInput(data.username);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUsername();
  }, [user]);

  // Fetch followers and following count
  useEffect(() => {
    const fetchFollowCounts = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/followers?userId=${user.uid}`);
        const data = await response.json();

        if (response.ok) {
          setFollowersCount(data.followersCount || 0);
          setFollowingCount(data.followingCount || 0);
        }
      } catch (error) {
        console.error("Error fetching follow counts:", error);
      }
    };

    fetchFollowCounts();
  }, [user]);

  const saveUsername = async () => {
    if (!usernameInput.trim()) {
      setUsernameError("Username cannot be empty");
      return;
    }

    // Validate format
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(usernameInput)) {
      setUsernameError(
        "Username must be 3-20 characters (lowercase letters, numbers, underscores only)"
      );
      return;
    }

    setUsernameSaving(true);
    setUsernameError("");

    try {
      const response = await fetch("/api/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          username: usernameInput.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsername(data.username);
        setIsEditingUsername(false);
        setUsernameError("");
      } else {
        setUsernameError(data.error || "Failed to save username");
      }
    } catch (error) {
      console.error("Error saving username:", error);
      setUsernameError("Failed to save username. Please try again.");
    } finally {
      setUsernameSaving(false);
    }
  };

  // Fetch followers list
  const fetchFollowersList = async () => {
    if (!user) return;

    setFollowersList([]); // Clear previous data
    setLoadingFollowers(true);
    setShowFollowersModal(true); // Show modal immediately

    try {
      const response = await fetch(
        `/api/followers?userId=${user.uid}&type=followers`
      );
      const data = await response.json();

      if (response.ok) {
        setFollowersList(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching followers list:", error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  // Fetch following list
  const fetchFollowingList = async () => {
    if (!user) return;

    setFollowingList([]); // Clear previous data
    setLoadingFollowers(true);
    setShowFollowingModal(true); // Show modal immediately

    try {
      const response = await fetch(
        `/api/followers?userId=${user.uid}&type=following`
      );
      const data = await response.json();

      if (response.ok) {
        setFollowingList(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching following list:", error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  // Fetch selected user's reels
  const fetchSelectedUserReels = async (userData) => {
    setSelectedUserData(userData);
    setSelectedUserReels([]);
    setLoadingUserReels(true);
    setShowUserReelsModal(true);

    try {
      const response = await fetch(`/api/reels?userId=${userData.id}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedUserReels(data.reels || []);
      } else {
        console.error("Error fetching user reels:", data);
      }
    } catch (error) {
      console.error("Error fetching user reels:", error);
    } finally {
      setLoadingUserReels(false);
    }
  };

  // Fetch user's reels
  const fetchUserReels = async () => {
    if (!user) return;

    setReelsLoading(true);
    try {
      const response = await fetch(`/api/reels?userId=${user.uid}`);
      const data = await response.json();

      if (response.ok) {
        setUserReels(data.reels || []);
      } else {
        console.error("Error fetching user reels:", data);
        setUserReels([]);
      }
    } catch (error) {
      console.error("Error fetching user reels:", error);
      setUserReels([]);
    } finally {
      setReelsLoading(false);
    }
  };

  // Delete a reel
  const deleteReel = async (reelId) => {
    if (
      !confirm(
        "Are you sure you want to delete this reel? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingReelId(reelId);
    try {
      const response = await fetch(`/api/reels/${reelId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from local state
        setUserReels((prev) => prev.filter((reel) => reel.id !== reelId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete reel");
      }
    } catch (error) {
      console.error("Error deleting reel:", error);
      alert("Failed to delete reel. Please try again.");
    } finally {
      setDeletingReelId(null);
    }
  };

  // Helper function to truncate text to specified number of characters
  const truncateToChars = (text, charLimit = 20) => {
    if (!text) return "";
    const trimmedText = text.trim();
    if (trimmedText.length <= charLimit) return trimmedText;
    return trimmedText.slice(0, charLimit) + "...";
  };

  // Get badge based on reel count
  const getBadgeForReelCount = (count) => {
    if (count >= 300)
      return {
        emoji: "💎",
        name: "Diamond",
        color: "from-cyan-400 to-blue-500",
      };
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
      return {
        emoji: "🥈",
        name: "Silver",
        color: "from-gray-400 to-gray-600",
      };
    if (count >= 1)
      return {
        emoji: "🥉",
        name: "Bronze",
        color: "from-orange-400 to-orange-600",
      };
    return null;
  };

  // Fetch reels on initial page load
  useEffect(() => {
    if (user) {
      fetchUserReels();
    }
  }, [user]);

  // Fetch reels when My Reels tab is active
  useEffect(() => {
    if (activeTab === "myreels") {
      fetchUserReels();
    }
  }, [activeTab]);

  const openTicketModal = (booking) => {
    setSelectedTicket(booking);
    setShowTicketModal(true);
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return "Date TBD";

    // Parse UTC date from database
    let date;
    if (dateString.includes("T") && dateString.includes("Z")) {
      date = new Date(dateString);
    } else if (dateString.includes("T")) {
      date = new Date(dateString + "Z");
    } else {
      date = new Date(dateString.replace(" ", "T") + "Z");
    }

    if (!date || isNaN(date.getTime())) {
      return "Date TBD";
    }

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  const getEventStatus = (booking) => {
    if (booking.status !== "CONFIRMED") {
      return { text: booking.status, className: "text-yellow-400" };
    }

    // Parse UTC date from database
    const dateStr = booking.event?.date;
    if (!dateStr) {
      return { text: "Unknown", className: "text-gray-400" };
    }

    let eventDate;
    if (dateStr.includes("T") && dateStr.includes("Z")) {
      eventDate = new Date(dateStr);
    } else if (dateStr.includes("T")) {
      eventDate = new Date(dateStr + "Z");
    } else {
      eventDate = new Date(dateStr.replace(" ", "T") + "Z");
    }

    if (!eventDate || isNaN(eventDate.getTime())) {
      return { text: "Unknown", className: "text-gray-400" };
    }

    const now = new Date(); // Current time in UTC

    if (eventDate >= now) {
      return { text: "Upcoming", className: "text-green-400" };
    } else {
      return { text: "Completed", className: "text-gray-400" };
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "overview") return true;

    // Parse UTC date from database
    const dateStr = booking.event?.date;
    if (!dateStr) return false;

    let eventDate;
    if (dateStr.includes("T") && dateStr.includes("Z")) {
      eventDate = new Date(dateStr);
    } else if (dateStr.includes("T")) {
      eventDate = new Date(dateStr + "Z");
    } else {
      eventDate = new Date(dateStr.replace(" ", "T") + "Z");
    }

    if (!eventDate || isNaN(eventDate.getTime())) return false;

    const now = new Date(); // Current time in UTC

    if (activeTab === "upcoming") {
      return eventDate >= now && booking.status === "CONFIRMED";
    }
    if (activeTab === "completed") {
      return eventDate < now && booking.status === "CONFIRMED";
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.animationDelay}s`,
                animationDuration: `${particle.animationDuration}s`,
              }}
            />
          ))}
        </div>

        <div className="text-center text-white relative z-10 p-8 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 max-w-md mx-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <EventHubLogo size={64} showText={false} />
          </div>

          {/* Lock Icon */}
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-4 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Authentication Required
          </h1>
          <p className="text-white/70 mb-2 text-lg">
            You need to be signed in to view your profile.
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
              className="block w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 font-medium shadow-lg"
            >
              Go to Home & Sign In
            </Link>
            <button
              onClick={() => router.back()}
              className="block w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors border border-white/20"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
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
          className="absolute w-96 h-96 bg-linear-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/">
              <EventHubLogo size={32} showText={true} />
            </Link>

            {/* Back to Home */}
            <Link
              href="/"
              className="text-white/80 hover:text-white transition-colors flex items-center space-x-2"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {(user.displayName ||
                    user.email?.split("@")[0] ||
                    "U")[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.displayName || user.email?.split("@")[0] || "User"}
              </h1>
              <p className="text-white/70 mb-2">{user.email}</p>

              {/* Creator Tier Badge */}
              {(() => {
                const reelsCount = userReels.length;
                let tier, emoji, gradient, textColor;

                if (reelsCount >= 300) {
                  tier = "Diamond Creator";
                  emoji = "💎";
                  gradient = "from-cyan-400 to-blue-600";
                  textColor = "text-cyan-300";
                } else if (reelsCount >= 200) {
                  tier = "Platinum Creator";
                  emoji = "🏆";
                  gradient = "from-gray-300 to-gray-500";
                  textColor = "text-gray-300";
                } else if (reelsCount >= 100) {
                  tier = "Gold Creator";
                  emoji = "🥇";
                  gradient = "from-yellow-400 to-yellow-600";
                  textColor = "text-yellow-400";
                } else if (reelsCount >= 50) {
                  tier = "Silver Creator";
                  emoji = "🥈";
                  gradient = "from-gray-200 to-gray-400";
                  textColor = "text-gray-200";
                } else {
                  tier = "Bronze Creator";
                  emoji = "🥉";
                  gradient = "from-orange-400 to-orange-600";
                  textColor = "text-orange-400";
                }

                return (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-black/40 to-black/20 border border-white/20 rounded-full mb-4">
                    <span className="text-lg">{emoji}</span>
                    {reelsCount === 0 ? (
                      <span className="font-medium text-xs text-yellow-400/90">
                        Post your moments to get your exclusive badges
                      </span>
                    ) : (
                      <>
                        <span className={`font-semibold text-sm ${textColor}`}>
                          {tier}
                        </span>
                        <span className="text-white/60 text-xs">
                          ({reelsCount} reels)
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* User Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto md:mx-0">
                <button
                  onClick={fetchFollowersList}
                  className="text-center hover:bg-white/5 rounded-lg p-2 transition-all cursor-pointer"
                >
                  <div className="text-2xl font-bold text-cyan-400">
                    {followersCount}
                  </div>
                  <div className="text-sm text-white/60">Followers</div>
                </button>
                <button
                  onClick={fetchFollowingList}
                  className="text-center hover:bg-white/5 rounded-lg p-2 transition-all cursor-pointer"
                >
                  <div className="text-2xl font-bold text-indigo-400">
                    {followingCount}
                  </div>
                  <div className="text-sm text-white/60">Following</div>
                </button>
                <div className="text-center p-2">
                  <div className="text-2xl font-bold text-pink-400">
                    {userReels.length}
                  </div>
                  <div className="text-sm text-white/60">Total Reels</div>
                  {getBadgeForReelCount(userReels.length) && (
                    <div className="mt-1.5">
                      <div className="text-2xl">
                        {getBadgeForReelCount(userReels.length).emoji}
                      </div>
                      {userReels.length === 0 ? (
                        <div className="text-xs text-yellow-400/90 mt-0.5 px-1 leading-relaxed">
                          Post your moments to get your exclusive badges
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-white/70 mt-0.5">
                            {getBadgeForReelCount(userReels.length).name}{" "}
                            Creator
                          </div>
                          <div className="text-xs text-white/50">
                            ({userReels.length} reels)
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  // Check if username is set
                  if (!username) {
                    // Scroll to username section and open editor
                    setActiveTab("overview");
                    setTimeout(() => {
                      setIsEditingUsername(true);
                      // Scroll to username section
                      const usernameSection =
                        document.getElementById("username-section");
                      if (usernameSection) {
                        usernameSection.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }, 100);
                  } else {
                    // Username is set, open upload modal
                    setShowUploadModal(true);
                  }
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg transition-all text-center font-medium shadow-lg hover:scale-105 transform"
              >
                📸 Post Reel
              </button>
              <Link
                href="/contact"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
              >
                Contact Support
              </Link>
              <button
                onClick={async () => {
                  try {
                    await signOut();
                    window.location.href = "/";
                  } catch (error) {
                    console.error("Error signing out:", error);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 mb-8">
          <div className="flex space-x-1 p-1">
            {[
              { id: "overview", label: "Overview", shortLabel: "Overview" },
              {
                id: "upcoming",
                label: "Upcoming Events",
                shortLabel: "Upcoming",
              },
              {
                id: "completed",
                label: "Event History",
                shortLabel: "History",
              },
              { id: "myreels", label: "My Reels", shortLabel: "Reels" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/70 mt-4">Loading your bookings...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Account Overview
                  </h2>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                      <h3 className="text-blue-400 font-semibold mb-2 text-sm">
                        Account Status
                      </h3>
                      <p className="text-white text-sm">Active Member</p>
                      <p className="text-white/60 text-xs">
                        Member since{" "}
                        {new Date(
                          user.metadata?.creationTime || Date.now()
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                      <h3 className="text-green-400 font-semibold mb-2 text-sm">
                        Total Events
                      </h3>
                      <p className="text-white text-xl font-bold">
                        {bookingStats.total}
                      </p>
                      <p className="text-white/60 text-xs">Events attended</p>
                    </div>

                    <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                      <h3 className="text-yellow-400 font-semibold mb-2 text-sm">
                        Upcoming
                      </h3>
                      <p className="text-white text-xl font-bold">
                        {bookingStats.upcoming}
                      </p>
                      <p className="text-white/60 text-xs">Events coming</p>
                    </div>

                    <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-lg p-4">
                      <h3 className="text-emerald-400 font-semibold mb-2 text-sm">
                        Completed
                      </h3>
                      <p className="text-white text-xl font-bold">
                        {bookingStats.completed}
                      </p>
                      <p className="text-white/60 text-xs">Events finished</p>
                    </div>

                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                      <h3 className="text-purple-400 font-semibold mb-2 text-sm">
                        User Role
                      </h3>
                      <p className="text-white text-sm">
                        {user.role || "Event Attendee"}
                      </p>
                      <p className="text-white/60 text-xs">Account type</p>
                    </div>
                  </div>

                  {/* Username for Reels */}
                  <div
                    id="username-section"
                    className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 rounded-lg p-6 mb-8"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-pink-400 font-semibold text-lg mb-1 flex items-center gap-2">
                          📸 Reels Username
                        </h3>
                        <p className="text-white/60 text-sm">
                          Set a unique username for posting reels (cannot be
                          changed once set)
                        </p>
                      </div>
                    </div>

                    {!username ? (
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={usernameInput}
                            onChange={(e) => {
                              setUsernameInput(e.target.value.toLowerCase());
                              setUsernameError("");
                            }}
                            placeholder="your_username"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                            maxLength={20}
                          />
                          <p className="text-white/40 text-xs mt-1">
                            3-20 characters, lowercase letters, numbers, and
                            underscores only
                          </p>
                        </div>

                        {usernameError && (
                          <p className="text-red-400 text-sm">
                            {usernameError}
                          </p>
                        )}

                        <button
                          onClick={saveUsername}
                          disabled={usernameSaving}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {usernameSaving ? "Saving..." : "Set Username"}
                        </button>
                      </div>
                    ) : (
                      <div>
                        {username ? (
                          <div className="flex items-center gap-2">
                            <span className="text-white text-lg font-mono bg-white/10 px-4 py-2 rounded-lg">
                              @{username}
                            </span>
                            <span className="text-green-400 text-sm">
                              ✓ Set
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsEditingUsername(true)}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg transition-all font-medium"
                          >
                            Set Username to Post Reels
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <h3 className="text-xl font-bold text-white mb-4">
                    Recent Activity
                  </h3>
                  {filteredBookings.slice(0, 3).length > 0 ? (
                    <div className="space-y-3">
                      {filteredBookings.slice(0, 3).map((booking) => {
                        // Get event image for recent activity
                        const getEventImage = () => {
                          if (booking.event?.imageUrl) {
                            return booking.event.imageUrl;
                          }

                          const categoryImages = {
                            Music:
                              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Technology:
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            "Food & Drink":
                              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            "Art & Culture":
                              "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Business:
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            "Health & Wellness":
                              "https://images.unsplash.com/photo-1506629905607-45c9e2dd4e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Gaming:
                              "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Education:
                              "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                            Entertainment:
                              "https://images.unsplash.com/photo-1574391884720-bbc9d0bca4f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                          };

                          return (
                            categoryImages[booking.event?.category] ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                          );
                        };

                        return (
                          <div
                            key={booking.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              {/* Event Thumbnail */}
                              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={getEventImage()}
                                  alt={booking.event?.title || "Event"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
                                  }}
                                />
                              </div>

                              {/* Event Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold truncate">
                                  {booking.event?.title || "Event"}
                                </h4>
                                <p className="text-white/60 text-sm">
                                  {formatEventDate(booking.event?.date)}
                                </p>
                                {booking.event?.category && (
                                  <p className="text-blue-400 text-xs">
                                    {booking.event.category}
                                  </p>
                                )}
                              </div>

                              {/* Status Badge */}
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  getEventStatus(booking).className
                                } bg-current/20 border border-current/30 shrink-0`}
                              >
                                {getEventStatus(booking).text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-white/60">No recent activity</p>
                  )}
                </div>
              )}

              {(activeTab === "upcoming" || activeTab === "completed") && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    {activeTab === "upcoming"
                      ? "Upcoming Events"
                      : "Event History"}
                  </h2>

                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-white/40"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-white font-semibold mb-2">
                        No {activeTab} events
                      </h3>
                      <p className="text-white/60 mb-4">
                        {activeTab === "upcoming"
                          ? "You don't have any upcoming events. Explore events to book your next adventure!"
                          : "You haven't attended any events yet. Start exploring!"}
                      </p>
                      <Link
                        href="/events"
                        className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        <span>Explore Events</span>
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
                            d="M17 8l4 4m0 0l-4 4m-4-4H3"
                          />
                        </svg>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {filteredBookings.map((booking) => {
                        const eventStatus = getEventStatus(booking);
                        const isCompleted = eventStatus.text === "Completed";

                        // Get event image - use event's imageUrl or fallback to category-based image
                        const getEventImage = () => {
                          if (booking.event?.imageUrl) {
                            return booking.event.imageUrl;
                          }

                          // Fallback images based on category
                          const categoryImages = {
                            Music:
                              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Technology:
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            "Food & Drink":
                              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            "Art & Culture":
                              "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Business:
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            "Health & Wellness":
                              "https://images.unsplash.com/photo-1506629905607-45c9e2dd4e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Gaming:
                              "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Education:
                              "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                            Entertainment:
                              "https://images.unsplash.com/photo-1574391884720-bbc9d0bca4f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                          };

                          return (
                            categoryImages[booking.event?.category] ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                          );
                        };

                        return (
                          <div
                            key={booking.id}
                            className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
                          >
                            <div className="flex flex-col lg:flex-row">
                              {/* Event Image */}
                              <div className="lg:w-80 h-48 lg:h-auto relative">
                                <img
                                  src={getEventImage()}
                                  alt={booking.event?.title || "Event"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                                  }}
                                />

                                {/* Event Status Badge */}
                                <div className="absolute top-3 right-3">
                                  <span
                                    className={`text-xs font-medium px-3 py-1 rounded-full ${eventStatus.className} bg-current/20 backdrop-blur-sm border border-current/30`}
                                  >
                                    {eventStatus.text}
                                  </span>
                                </div>

                                {/* Completed Stamp for Event History */}
                                {isCompleted && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-green-600/90 backdrop-blur-sm border-2 border-green-400 rounded-full p-4 transform rotate-12 shadow-lg">
                                      <div className="flex flex-col items-center text-white">
                                        <svg
                                          className="w-8 h-8 mb-1"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                        </svg>
                                        <span className="text-xs font-bold">
                                          COMPLETED
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Event Info */}
                              <div className="flex-1 p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between h-full">
                                  <div className="flex-1 mb-4 lg:mb-0">
                                    <h3 className="text-xl font-bold text-white mb-3">
                                      {booking.event?.title || "Event"}
                                    </h3>

                                    <div className="space-y-3 text-white/70">
                                      <div className="flex items-center space-x-2">
                                        <svg
                                          className="w-4 h-4 shrink-0"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                                          />
                                        </svg>
                                        <span className="text-sm">
                                          {formatEventDate(booking.event?.date)}
                                        </span>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <svg
                                          className="w-4 h-4 shrink-0"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                        </svg>
                                        <span className="text-sm">
                                          {booking.event?.location ||
                                            "Location TBA"}
                                        </span>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <svg
                                          className="w-4 h-4 shrink-0"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                          />
                                        </svg>
                                        <span className="text-sm">
                                          {booking.tickets} ticket
                                          {booking.tickets > 1 ? "s" : ""}
                                        </span>
                                      </div>

                                      {booking.event?.category && (
                                        <div className="flex items-center space-x-2">
                                          <svg
                                            className="w-4 h-4 shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                            />
                                          </svg>
                                          <span className="text-sm text-blue-400">
                                            {booking.event.category}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 lg:ml-6">
                                    {!isCompleted ? (
                                      // For upcoming events - show View Ticket and Event Details buttons
                                      <>
                                        <button
                                          onClick={() =>
                                            openTicketModal(booking)
                                          }
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
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
                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                          </svg>
                                          <span>View Ticket</span>
                                        </button>

                                        <Link
                                          href={`/events/${booking.eventId}`}
                                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
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
                                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                          <span>Event Details</span>
                                        </Link>
                                      </>
                                    ) : (
                                      // For completed events - show only completed stamp
                                      <div className="bg-green-600/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg flex items-center justify-center space-x-2">
                                        <svg
                                          className="w-4 h-4"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                        </svg>
                                        <span className="font-medium text-sm">
                                          Event Completed
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* My Reels Tab */}
              {activeTab === "myreels" && (
                <div className="-m-6 p-4">
                  <h2 className="text-2xl font-bold text-white mb-3">
                    My Reels
                  </h2>

                  {/* Creator Tier Info */}
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🏅</span>
                      <div className="flex-1">
                        <p className="text-white/90 text-xs sm:text-sm mb-1">
                          <span className="font-semibold">Creator Tiers:</span>{" "}
                          Post reels to unlock badges!
                        </p>
                        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-white/70">
                          <span>🥉 Bronze (0-49)</span>
                          <span>🥈 Silver (50-99)</span>
                          <span>🥇 Gold (100-199)</span>
                          <span>🏆 Platinum (200-299)</span>
                          <span>💎 Diamond (300+)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {reelsLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      <p className="text-white/70 mt-4">
                        Loading your reels...
                      </p>
                    </div>
                  ) : userReels.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📸</span>
                      </div>
                      <h3 className="text-white font-semibold mb-2">
                        No reels yet
                      </h3>
                      <p className="text-white/60 mb-4">
                        You haven't posted any reels. Start sharing your
                        moments!
                      </p>
                      <Link
                        href="/reels"
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg transition-all font-medium"
                      >
                        <span>Post Your First Reel</span>
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
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userReels.map((reel) => (
                        <div
                          key={reel.id}
                          className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition-all flex flex-row"
                        >
                          {/* Reel Image/Video - Left Side */}
                          <div className="relative w-24 sm:w-32 md:w-40 flex-shrink-0 bg-black">
                            {reel.media_type === "video" ? (
                              <video
                                src={reel.media_url}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <img
                                src={reel.media_url}
                                alt={reel.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          {/* Reel Info - Right Side */}
                          <div className="flex-1 p-2 flex flex-col justify-between">
                            <div>
                              <h3 className="text-white font-semibold text-sm sm:text-base mb-1">
                                {truncateToChars(reel.title, 20)}
                              </h3>

                              {/* Description */}
                              {reel.description && (
                                <p className="text-white/60 text-xs mb-2">
                                  {truncateToChars(reel.description, 20)}
                                </p>
                              )}

                              {/* Stats and Tags Row */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {/* Likes and Comments */}
                                <div className="flex items-center gap-2 text-white/80 text-xs">
                                  <span className="flex items-center gap-1">
                                    ❤️ {reel.likes_count || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    💬 {reel.comments_count || 0}
                                  </span>
                                </div>

                                {/* Separator */}
                                {reel.tags && reel.tags.length > 0 && (
                                  <span className="text-white/40">•</span>
                                )}

                                {/* Tags */}
                                {reel.tags && reel.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {reel.tags.slice(0, 2).map((tag, i) => (
                                      <span
                                        key={i}
                                        className="px-1.5 py-0.5 bg-white/10 rounded-full text-white/70 text-[10px]"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Date */}
                              <p className="text-white/40 text-[10px]">
                                {new Date(reel.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1.5 mt-2">
                              <button
                                onClick={() => {
                                  setSelectedReel(reel);
                                  setShowReelModal(true);
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-lg transition-colors text-center text-xs font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReelForComments(reel);
                                  setShowCommentsModal(true);
                                }}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded-lg transition-colors text-center text-xs font-medium flex items-center justify-center gap-1"
                              >
                                <span>💬</span>
                                <span className="hidden sm:inline">
                                  Comments
                                </span>
                              </button>
                              <button
                                onClick={() => deleteReel(reel.id)}
                                disabled={deletingReelId === reel.id}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingReelId === reel.id ? "..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <TicketModal
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setSelectedTicket(null);
          }}
          booking={selectedTicket}
        />
      )}

      {/* Upload Reel Modal */}
      {showUploadModal && (
        <UploadReelModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newReel) => {
            // Add new reel to the list
            setUserReels((prev) => [newReel, ...prev]);
            setShowUploadModal(false);
            // Redirect to reels page to show the new reel
            router.push("/reels");
          }}
        />
      )}

      {/* Reel Viewer Modal */}
      {showReelModal && selectedReel && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => {
            setShowReelModal(false);
            setSelectedReel(null);
          }}
        >
          <div
            className="relative w-full max-w-md h-[90vh] bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowReelModal(false);
                setSelectedReel(null);
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
            <div className="relative w-full h-full">
              {/* Media */}
              {selectedReel.media_type === "video" ? (
                <video
                  src={selectedReel.media_url}
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  playsInline
                  controls
                />
              ) : (
                <img
                  src={selectedReel.media_url}
                  alt={selectedReel.title}
                  className="w-full h-full object-contain"
                />
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

              {/* Action Buttons (Right Side) */}
              <div className="absolute right-4 bottom-32 flex flex-col gap-4 pointer-events-auto z-20">
                {/* Like Button */}
                <button
                  onClick={async () => {
                    if (!user) {
                      alert("Please sign in to like reels");
                      return;
                    }

                    const isLiked = likedReels.has(selectedReel.id);

                    // Update UI instantly
                    if (isLiked) {
                      setLikedReels((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(selectedReel.id);
                        return newSet;
                      });
                      setSelectedReel((prev) => ({
                        ...prev,
                        likes_count: Math.max(0, (prev.likes_count || 0) - 1),
                      }));
                    } else {
                      setLikedReels(
                        (prev) => new Set([...prev, selectedReel.id])
                      );
                      setSelectedReel((prev) => ({
                        ...prev,
                        likes_count: (prev.likes_count || 0) + 1,
                      }));
                    }

                    // Send request to server
                    try {
                      const response = await fetch(
                        `/api/reels/${selectedReel.id}/like`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: user.uid }),
                        }
                      );

                      if (response.ok) {
                        const data = await response.json();
                        setSelectedReel((prev) => ({
                          ...prev,
                          likes_count: data.likes_count,
                        }));
                        if (data.liked) {
                          setLikedReels(
                            (prev) => new Set([...prev, selectedReel.id])
                          );
                        } else {
                          setLikedReels((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(selectedReel.id);
                            return newSet;
                          });
                        }
                      }
                    } catch (error) {
                      console.error("Error liking reel:", error);
                    }
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div
                    className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all group-hover:scale-110 ${
                      likedReels.has(selectedReel.id)
                        ? "bg-red-500/20"
                        : "bg-white/10 group-hover:bg-white/20"
                    }`}
                  >
                    <svg
                      className={`w-7 h-7 transition-all duration-200 ${
                        likedReels.has(selectedReel.id)
                          ? "fill-red-500 scale-110"
                          : "fill-none stroke-white stroke-2"
                      }`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    {selectedReel.likes_count || 0}
                  </span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => {
                    setSelectedReelForComments(selectedReel);
                    setShowCommentsModal(true);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-500/30 transition-all group-hover:scale-110">
                    <span className="text-2xl">💬</span>
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    {selectedReel.comments_count || 0}
                  </span>
                </button>
              </div>

              {/* Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                  {selectedReel.title}
                </h3>

                {selectedReel.description && (
                  <p className="text-white/90 text-sm mb-3 line-clamp-3">
                    {selectedReel.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-3 text-white text-sm">
                  <span className="flex items-center gap-1">
                    ❤️ {selectedReel.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    💬 {selectedReel.comments_count || 0}
                  </span>
                </div>

                {/* Tags */}
                {selectedReel.tags && selectedReel.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedReel.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white/20 rounded-full text-white/90 text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedReelForComments && (
        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedReelForComments(null);
          }}
          reel={selectedReelForComments}
          currentUser={user}
          reelOwnerId={selectedReelForComments.user_id}
          zIndex={80}
        />
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] flex flex-col border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Followers</h3>
              <button
                onClick={() => setShowFollowersModal(false)}
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

            {/* Loading State */}
            {loadingFollowers && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            )}

            {/* Users List */}
            {!loadingFollowers && (
              <div className="overflow-y-auto flex-1 space-y-3">
                {followersList.length === 0 ? (
                  <p className="text-white/60 text-center py-8">
                    No followers yet
                  </p>
                ) : (
                  followersList.map((follower) => (
                    <button
                      key={follower.id}
                      onClick={() => fetchSelectedUserReels(follower)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {follower.photoURL ? (
                        <img
                          src={follower.photoURL}
                          alt={follower.username || "User"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400/50"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-cyan-400/50"
                        style={{ display: follower.photoURL ? "none" : "flex" }}
                      >
                        {(follower.username ||
                          follower.email ||
                          "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">
                            {follower.username || "Anonymous"}
                          </span>
                          {follower.reelCount !== undefined &&
                            getBadgeForReelCount(follower.reelCount) && (
                              <span
                                className="text-lg"
                                title={`${
                                  getBadgeForReelCount(follower.reelCount).name
                                } Creator (${follower.reelCount} reels)`}
                              >
                                {getBadgeForReelCount(follower.reelCount).emoji}
                              </span>
                            )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] flex flex-col border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Following</h3>
              <button
                onClick={() => setShowFollowingModal(false)}
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

            {/* Loading State */}
            {loadingFollowers && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
              </div>
            )}

            {/* Users List */}
            {!loadingFollowers && (
              <div className="overflow-y-auto flex-1 space-y-3">
                {followingList.length === 0 ? (
                  <p className="text-white/60 text-center py-8">
                    Not following anyone yet
                  </p>
                ) : (
                  followingList.map((following) => (
                    <button
                      key={following.id}
                      onClick={() => fetchSelectedUserReels(following)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {following.photoURL ? (
                        <img
                          src={following.photoURL}
                          alt={following.username || "User"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400/50"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-indigo-400/50"
                        style={{
                          display: following.photoURL ? "none" : "flex",
                        }}
                      >
                        {(following.username ||
                          following.email ||
                          "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">
                            {following.username || "Anonymous"}
                          </span>
                          {following.reelCount !== undefined &&
                            getBadgeForReelCount(following.reelCount) && (
                              <span
                                className="text-lg"
                                title={`${
                                  getBadgeForReelCount(following.reelCount).name
                                } Creator (${following.reelCount} reels)`}
                              >
                                {
                                  getBadgeForReelCount(following.reelCount)
                                    .emoji
                                }
                              </span>
                            )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Reels Modal */}
      {showUserReelsModal && selectedUserData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {selectedUserData.photoURL ? (
                  <img
                    src={selectedUserData.photoURL}
                    alt={selectedUserData.username || "User"}
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-400/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold border-2 border-purple-400/50">
                    {(selectedUserData.username ||
                      selectedUserData.email ||
                      "U")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedUserData.username || "Anonymous"}
                  </h3>
                  <p className="text-sm text-white/60">Reels</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserReelsModal(false);
                  setSelectedUserData(null);
                  setSelectedUserReels([]);
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

            {/* Loading State */}
            {loadingUserReels && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
              </div>
            )}

            {/* Reels Grid */}
            {!loadingUserReels && (
              <div className="overflow-y-auto flex-1">
                {selectedUserReels.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/60 text-lg">No reels yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedUserReels.map((reel) => (
                      <button
                        key={reel.id}
                        onClick={() => {
                          // Open the reel viewer modal on top of user reels modal
                          setSelectedReel(reel);
                          setShowReelModal(true);
                        }}
                        className="relative aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer border-2 border-white/10 hover:border-purple-400/50 transition-all"
                      >
                        {reel.media_type === "video" ? (
                          <video
                            src={reel.media_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={reel.media_url}
                            alt={reel.title}
                            className="w-full h-full object-cover"
                          />
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white font-semibold text-sm line-clamp-2 mb-2">
                              {reel.title}
                            </p>
                            <div className="flex items-center gap-3 text-white/80 text-xs">
                              <span className="flex items-center gap-1">
                                ❤️ {reel.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                💬 {reel.comments_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Play icon for videos */}
                        {reel.media_type === "video" && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg
                              className="w-6 h-6 text-white ml-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
