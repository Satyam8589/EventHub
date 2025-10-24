"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "../../components/EventCard";
import LoginForm from "../../components/auth/LoginForm";
import SignupForm from "../../components/auth/SignupForm";
import UserMenu from "../../components/auth/UserMenu";

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedDate, setSelectedDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileMenu && !event.target.closest(".mobile-menu-container")) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMobileMenu]);

  // Generate particles on client side only to avoid hydration issues
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

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        console.log("Events page: Fetching events from /api/events...");
        const response = await fetch("/api/events");
        console.log("Events page: Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Events page: API Error Response:", errorText);
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Events page: Events data received:", data);
        console.log("Events page: Total events fetched:", data.events?.length || 0);
        
        setEvents(data.events || []);
      } catch (err) {
        console.error("Events page: Error fetching events:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const categories = [
    "All Categories",
    "Music",
    "Technology",
    "Food & Drink",
    "Art & Culture",
    "Sports",
    "Business",
    "Gaming",
    "Education",
    "Entertainment",
    "Health & Wellness",
  ];

  // Filter events based on search and category
  const filteredEvents = events
    .filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All Categories" ||
        event.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort featured events first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      // If both are featured or both are not featured, maintain original order
      return 0;
    });

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

      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10 mobile-menu-container">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-white font-bold text-xl">EventHub</span>
            </div>

            <div className="hidden md:flex items-center space-x-8 text-white/80">
              <a href="/" className="hover:text-white transition-colors">
                Home
              </a>
              <a href="/events" className="text-white font-medium">
                Events
              </a>
              <a
                href="/my-events"
                className="hover:text-white transition-colors"
              >
                My Events
              </a>
              <a href="/about" className="hover:text-white transition-colors">
                About
              </a>
              <a href="/contact" className="hover:text-white transition-colors">
                Contact
              </a>

              {/* Admin Navigation - Only show for admins */}
              {!authLoading &&
                user &&
                (user.role === "SUPER_ADMIN" ||
                  user.role === "EVENT_ADMIN") && (
                  <a
                    href="/admin"
                    className="hover:text-blue-400 transition-colors font-medium bg-blue-600/20 px-3 py-1 rounded-lg border border-blue-500/30"
                  >
                    🛡️ Admin Panel
                  </a>
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
                    </div>
                  ) : (
                    <div className="hidden md:flex items-center space-x-3">
                      <button
                        onClick={() => setShowLogin(true)}
                        className="text-white/80 hover:text-white transition-colors font-medium"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => setShowSignup(true)}
                        className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                  <span
                    className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                      showMobileMenu ? "rotate-45 translate-y-1.5" : ""
                    }`}
                  ></span>
                  <span
                    className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                      showMobileMenu ? "opacity-0" : ""
                    }`}
                  ></span>
                  <span
                    className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                      showMobileMenu ? "-rotate-45 -translate-y-1.5" : ""
                    }`}
                  ></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden relative z-20 bg-black/95 backdrop-blur-md border-b border-white/10 mobile-menu-container">
          <div className="px-6 py-4 space-y-3">
            {/* Navigation Links */}
            <a
              href="/"
              className="block text-white/80 hover:text-white transition-colors py-2"
            >
              Home
            </a>
            <a href="/events" className="block text-white font-medium py-2">
              Events
            </a>
            <a
              href="/my-events"
              className="block text-white/80 hover:text-white transition-colors py-2"
            >
              My Events
            </a>
            <a
              href="/about"
              className="block text-white/80 hover:text-white transition-colors py-2"
            >
              About
            </a>
            <a
              href="/contact"
              className="block text-white/80 hover:text-white transition-colors py-2"
            >
              Contact
            </a>

            {/* Admin Navigation - Only show for admins */}
            {!authLoading &&
              user &&
              (user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN") && (
                <a
                  href="/admin"
                  className="block text-blue-400 hover:text-blue-300 transition-colors font-medium bg-blue-600/20 px-3 py-2 rounded-lg border border-blue-500/30 mt-3"
                >
                  🛡️ Admin Panel
                </a>
              )}

            {/* Mobile Authentication - Only show on mobile screens */}
            {!authLoading && (
              <div className="md:hidden border-t border-white/20 mt-2 pt-2">
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
                      <a
                        href="/admin"
                        className="block px-3 py-2 text-blue-400 hover:text-blue-300 transition-colors border-t border-white/20"
                      >
                        🛡️ Admin Panel
                      </a>
                    )}

                    <button
                      onClick={async () => {
                        try {
                          const result = await signOut();

                          // Only close menu and reload if sign out was successful
                          if (!result.error) {
                            setShowMobileMenu(false);
                            window.location.reload();
                          } else {
                            setShowMobileMenu(false);
                          }
                        } catch (error) {
                          console.error("Error signing out:", error);
                          setShowMobileMenu(false);
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
                        setShowMobileMenu(false);
                        setShowLogin(true);
                      }}
                      className="w-full text-white/80 hover:text-white transition-colors text-left py-2"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowSignup(true);
                      }}
                      className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm"
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

      {/* Header Section */}
      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Discover Events
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Explore our calendar of amazing events
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-300">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="text-gray-900 bg-white"
                  >
                    {category}
                  </option>
                ))}
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />

              {/* More Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
              >
                <span>⚙️</span>
                <span>More Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-300">
            <span className="font-medium text-white">
              {filteredEvents.length} Events Found
            </span>
          </p>
          <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <span>⚙️</span>
            <span>More Filters</span>
          </button>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Loading events...
            </h3>
            <p className="text-gray-300">
              Please wait while we fetch the latest events
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Error loading events
            </h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <EventCard
                  event={{
                    ...event,
                    date: formatEventDate(event.date, event.time),
                    registered: event._count?.bookings || 0,
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-300 mb-4">
              Try adjusting your search criteria or browse all categories
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All Categories");
                setSelectedDate("");
              }}
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Load More Button */}
        {filteredEvents.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium">
              Load More Events
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-white font-bold text-xl">EventHub</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your premium destination for discovering and booking amazing
                events
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Browse Events
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    My Events
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Music
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Technology
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Food & Drink
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sports
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <p className="text-gray-400 text-sm mb-2">
                📧 join.eventhub@gmail.com
              </p>
              <p className="text-gray-400 text-sm mb-2">📞 +91 9263472616</p>
              <p className="text-gray-400 text-sm">📍 123 Event St, NY 10001</p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 EventHub. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Authentication Modals */}
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
    </div>
  );
}
