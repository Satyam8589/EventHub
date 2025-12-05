"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function MainBottomNavBar() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (!result.error) {
        setShowUserMenu(false);
        router.push("/");
      }
    } catch (error) {
      // Silent error handling for security
      setShowUserMenu(false);
    }
  };

  const isActive = (path) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const NavItem = ({ href, icon, label, onClick, badge = null }) => (
    <Link
      href={href || "#"}
      onClick={onClick}
      className={`flex flex-col items-center justify-center pt-1.5 pb-0.5 px-2 min-w-0 flex-1 relative transition-all duration-300 group ${
        isActive(href)
          ? "text-blue-400 scale-105"
          : "text-gray-400 hover:text-gray-300 hover:scale-110"
      } rounded-xl hover:bg-gray-800/30`}
    >
      <div className="relative mb-0.5">
        {/* Icon container with glow effect */}
        <div
          className={`transition-all duration-300 ${
            isActive(href)
              ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-110"
              : "group-hover:drop-shadow-[0_0_4px_rgba(156,163,175,0.3)]"
          }`}
        >
          {icon}
        </div>

        {/* Badge */}
        {badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
            {badge}
          </span>
        )}
      </div>

      {/* Label */}
      <span
        className={`text-[10px] font-medium tracking-wide transition-all duration-300 truncate w-full text-center ${
          isActive(href) ? "font-semibold" : "group-hover:font-medium"
        }`}
      >
        {label}
      </span>

      {/* Active indicator */}
      {isActive(href) && (
        <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg shadow-blue-400/50 animate-pulse"></div>
      )}

      {/* Hover glow */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none ${
          isActive(href)
            ? "bg-blue-500/10 shadow-lg shadow-blue-500/20"
            : "group-hover:bg-gray-700/20"
        }`}
      ></div>
    </Link>
  );

  const UserMenuIcon = () => (
    <div className="relative user-menu-container">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`flex flex-col items-center justify-center pt-1.5 pb-0.5 px-2 relative ${
          showUserMenu || isActive("/profile")
            ? "text-blue-400"
            : "text-gray-400 hover:text-gray-300"
        } transition-all duration-300 group`}
      >
        <div className="relative">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              user
                ? "bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25"
                : "bg-gray-600"
            } border-2 ${
              showUserMenu || isActive("/profile")
                ? "border-blue-400 shadow-lg shadow-blue-400/25"
                : "border-transparent"
            } 
          transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
          >
            {user ? (
              <span className="text-white font-bold text-sm">
                {(user.displayName || user.email)?.charAt(0).toUpperCase()}
              </span>
            ) : (
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
          {user && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse shadow-sm"></div>
          )}
        </div>
        <span className="text-[10px] mt-0.5 font-medium tracking-wide">
          {user ? "Account" : "Login"}
        </span>
        {(showUserMenu || isActive("/profile")) && (
          <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-sm"></div>
        )}
      </button>

      {/* Centered Profile Modal */}
      {showUserMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 transition-opacity duration-300"
            onClick={() => setShowUserMenu(false)}
          />

          {/* Centered Modal - Positioned in positive Y-axis */}
          <div className="fixed inset-0 flex items-end justify-center z-50 p-4 pb-24">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-sm mx-auto transform transition-all duration-300 scale-100 opacity-100">
              {user ? (
                <div className="p-6">
                  {/* Header with close button */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      My Account
                    </h3>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* User Info Card */}
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl border border-blue-500/30 mb-6 hover:border-blue-400/40 transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-blue-500/20">
                      <span className="text-white font-bold text-xl">
                        {(user.displayName || user.email)
                          ?.charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-lg truncate">
                        {user.displayName || user.email?.split("@")[0]}
                      </p>
                      <p className="text-blue-300 text-sm truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-green-400 text-xs font-medium">
                          Online
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-2 mb-6">
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl transition-all duration-200 group border border-transparent hover:border-gray-700"
                    >
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                        <svg
                          className="w-5 h-5 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <span className="font-medium">Profile Settings</span>
                    </Link>

                    <Link
                      href="/my-events"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl transition-all duration-200 group border border-transparent hover:border-gray-700"
                    >
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                        <svg
                          className="w-5 h-5 text-purple-400"
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
                      <span className="font-medium">My Events</span>
                    </Link>

                    {/* Admin Panel - Only show for admins */}
                    {(user.role === "SUPER_ADMIN" ||
                      user.role === "EVENT_ADMIN") && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-orange-300 hover:text-orange-200 hover:bg-orange-500/10 rounded-xl transition-all duration-200 group border border-orange-500/30 hover:border-orange-400/40"
                      >
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                          <svg
                            className="w-5 h-5 text-orange-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </div>
                        <span className="font-medium">🛡️ Admin Panel</span>
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 border border-red-500/30 hover:border-red-400/40 group"
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
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  {/* Header with close button */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      Welcome to EventHub! 🎉
                    </h3>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <p className="text-gray-300 text-center mb-6 leading-relaxed">
                    Join our community to discover amazing events and book your
                    next adventure!
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to login page
                        router.push("/?login=true");
                        // Small delay to ensure navigation happens, then reload
                        setTimeout(() => {
                          if (typeof window !== "undefined") {
                            window.location.reload();
                          }
                        }, 200);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
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
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to signup page
                        router.push("/?signup=true");
                        // Small delay to ensure navigation happens, then reload
                        setTimeout(() => {
                          if (typeof window !== "undefined") {
                            window.location.reload();
                          }
                        }, 200);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 font-medium border border-gray-600 hover:border-gray-500 transform hover:scale-105"
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
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      <span>Sign Up</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Bottom Navigation Bar - Only visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/50 z-40 md:hidden shadow-2xl shadow-black/20">
        {/* Gradient overlay for visual appeal */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

        <div className="flex items-center justify-around px-1 pt-1 pb-0.5 max-w-md mx-auto relative">
          <NavItem
            href="/"
            icon={
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            }
            label="Home"
          />

          <NavItem
            href="/events"
            icon={
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            label="Events"
          />

          <NavItem
            href="/gamification"
            icon={
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            }
            label="Reviews"
          />

          {user && (
            <NavItem
              href="/my-events"
              icon={
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
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              }
              label="Tickets"
            />
          )}

          {!user && (
            <NavItem
              href="/about"
              icon={
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              label="About"
            />
          )}

          <UserMenuIcon />
        </div>
      </div>

      {/* Padding spacer for mobile bottom navigation */}
      <div className="h-12 md:hidden"></div>
    </>
  );
}
