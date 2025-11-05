"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import EventHubLogo from "./EventHubLogo";
import UserMenu from "./auth/UserMenu";

export default function Navbar({ setShowLogin, setShowSignup }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading: authLoading, signOut, mounted } = useAuth();

  // Show minimal navbar until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="cursor-pointer">
              <EventHubLogo size={32} showText={true} />
            </Link>
            <div className="animate-pulse w-24 h-8 bg-white/20 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest(".mobile-menu-container")) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="cursor-pointer">
            <EventHubLogo size={32} showText={true} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-white/80">
            <Link
              href="/"
              className="hover:text-white transition-colors font-medium"
            >
              Home
            </Link>
            <Link href="/events" className="hover:text-white transition-colors">
              Events
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link
              href="/gamification"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>🏆</span>
              <span>Leaderboard</span>
            </Link>

            {/* Show My Events and Profile only when logged in */}
            {!authLoading && user && (
              <>
                <Link
                  href="/my-events"
                  className="hover:text-white transition-colors"
                >
                  My Events
                </Link>
                <Link
                  href="/profile"
                  className="hover:text-white transition-colors"
                >
                  Profile
                </Link>
              </>
            )}

            {/* Admin Navigation - Only show for admins */}
            {!authLoading &&
              user &&
              (user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN") && (
                <Link
                  href="/admin"
                  className="hover:text-blue-400 transition-colors font-medium bg-blue-600/20 px-3 py-1 rounded-lg border border-blue-500/30"
                >
                  🛡️ Admin Panel
                </Link>
              )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Authentication Section */}
            {!authLoading && (
              <>
                {user ? (
                  <div className="hidden md:flex items-center space-x-3">
                    <UserMenu />
                    <button
                      onClick={async () => {
                        try {
                          const result = await signOut();
                          if (!result.error) {
                            window.location.reload();
                          }
                        } catch (error) {
                          // Silent error handling for security
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
                  </div>
                ) : (
                  <div className="hidden md:flex items-center space-x-3">
                    <button
                      onClick={() => setShowLogin && setShowLogin(true)}
                      className="text-white/80 hover:text-white transition-colors px-4 py-2 text-sm font-medium"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setShowSignup && setShowSignup(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Mobile menu button - Hidden since we have bottom nav */}
            <div className="mobile-menu-container lg:hidden hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
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
                    d={
                      mobileMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu - Hidden since we have bottom nav */}
        {false && mobileMenuOpen && (
          <div className="lg:hidden mobile-menu-container">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black/40 backdrop-blur-md rounded-lg mt-2">
              <Link
                href="/"
                className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/events"
                className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/gamification"
                className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                🏆 Leaderboard
              </Link>

              {/* Show My Events and Profile only when logged in */}
              {!authLoading && user && (
                <>
                  <Link
                    href="/my-events"
                    className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Events
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                </>
              )}

              {/* Mobile Authentication */}
              {!authLoading && (
                <div className="border-t border-white/20 mt-2 pt-2">
                  {user ? (
                    <>
                      <div className="px-3 py-2 border-b border-white/20">
                        <p className="text-sm font-medium text-white">
                          {user.displayName || user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-white/60">{user.email}</p>
                      </div>

                      {/* Admin Panel Link - Only show for admins */}
                      {(user.role === "SUPER_ADMIN" ||
                        user.role === "EVENT_ADMIN") && (
                        <Link
                          href="/admin"
                          className="block px-3 py-2 text-blue-400 hover:text-blue-300 transition-colors border-t border-white/20"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          🛡️ Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={async () => {
                          try {
                            const result = await signOut();
                            if (!result.error) {
                              setMobileMenuOpen(false);
                              window.location.reload();
                            } else {
                              setMobileMenuOpen(false);
                            }
                          } catch (error) {
                            // Silent error handling for security
                            setMobileMenuOpen(false);
                          }
                        }}
                        className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-2 space-y-2">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setShowLogin && setShowLogin(true);
                        }}
                        className="w-full text-white/80 hover:text-white transition-colors text-left py-2"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setShowSignup && setShowSignup(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
