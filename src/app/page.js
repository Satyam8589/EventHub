"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "../components/EventCard";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import UserMenu from "../components/auth/UserMenu";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [particles, setParticles] = useState([]);

  const { user, loading: authLoading, signOut } = useAuth();

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
        const response = await fetch("/api/events");
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events.slice(0, 6)); // Show only first 6 events on homepage
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
      <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-white font-bold text-lg sm:text-xl">
                EventHub
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-white/80">
              <a
                href="/"
                className="hover:text-white transition-colors font-medium"
              >
                Home
              </a>
              <a href="/events" className="hover:text-white transition-colors">
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
                        className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-4 lg:px-6 py-2 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm lg:text-base"
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white p-2"
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

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-black/40 backdrop-blur-md rounded-lg mt-2">
                <a
                  href="/"
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Home
                </a>
                <a
                  href="/events"
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Events
                </a>
                <a
                  href="/my-events"
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  My Events
                </a>
                <a
                  href="/about"
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  About
                </a>
                <a
                  href="/contact"
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Contact
                </a>

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
                                setMobileMenuOpen(false);
                                window.location.reload();
                              } else {
                                setMobileMenuOpen(false);
                              }
                            } catch (error) {
                              console.error("Error signing out:", error);
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
                            setShowLogin(true);
                          }}
                          className="w-full text-white/80 hover:text-white transition-colors text-left py-2"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 text-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 sm:mb-6 animate-fade-in-up leading-tight">
            Discover Amazing Events Near You
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-300 px-4">
            Join thousands of people experiencing the best events in music,
            food, technology, and community. Book your next adventure today!
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto mb-8 sm:mb-12 animate-fade-in-up animation-delay-600 px-4">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search events, artists, venues..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
            <button className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto">
              Search
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up animation-delay-900 px-4">
            <button className="bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base">
              Browse Events
            </button>
            <button className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">🎪</div>
              <div className="text-3xl font-bold text-white mb-2">10,000+</div>
              <div className="text-gray-300">Events Listed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">👥</div>
              <div className="text-3xl font-bold text-white mb-2">500K+</div>
              <div className="text-gray-300">Happy Attendees</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-4xl mb-4">⭐</div>
              <div className="text-3xl font-bold text-white mb-2">4.9/5</div>
              <div className="text-gray-300">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="relative z-10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
            Explore by Category
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { name: "Music", icon: "🎵", color: "from-pink-500 to-rose-500" },
              {
                name: "Business",
                icon: "💼",
                color: "from-blue-500 to-cyan-500",
              },
              {
                name: "Food & Drink",
                icon: "🍕",
                color: "from-orange-500 to-amber-500",
              },
              {
                name: "Art & Culture",
                icon: "🎨",
                color: "from-purple-500 to-indigo-500",
              },
            ].map((category, index) => (
              <div
                key={category.name}
                className={`bg-linear-to-br ${category.color} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl`}
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">
                  {category.icon}
                </div>
                <h3 className="text-white font-semibold text-sm sm:text-base lg:text-lg">
                  {category.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="relative z-10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Featured Events
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base px-4">
              Don't miss out on these incredible experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {loading
              ? Array(3)
                  .fill()
                  .map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl h-96 border border-white/20"></div>
                    </div>
                  ))
              : events.slice(0, 3).map((event, index) => (
                  <div
                    key={event.id}
                    style={{ animationDelay: `${index * 200}ms` }}
                    className="animate-fade-in-up"
                  >
                    <EventCard
                      event={{
                        ...event,
                        date: formatEventDate(event.date, event.time),
                        registered: event._count?.bookings || 0,
                        featured: true,
                      }}
                    />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="relative z-10 py-12 sm:py-16 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Upcoming Events
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base px-4">
              Discover more amazing events happening soon
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {loading
              ? Array(3)
                  .fill()
                  .map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl h-96 border border-white/20"></div>
                    </div>
                  ))
              : events.slice(3, 6).map((event, index) => (
                  <div
                    key={event.id}
                    style={{ animationDelay: `${index * 200}ms` }}
                    className="animate-fade-in-up"
                  >
                    <EventCard
                      event={{
                        ...event,
                        date: formatEventDate(event.date, event.time),
                        registered: event._count?.bookings || 0,
                        featured: false,
                      }}
                    />
                  </div>
                ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="/events"
              className="inline-block bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              View All Events
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Create Unforgettable Memories?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join EventHub today and get exclusive access to events, early-bird
            discounts, and personalized recommendations.
          </p>
          <button className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl">
            Start Exploring
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/30 backdrop-blur-md border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-gray-300">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-white font-bold text-xl">EventHub</span>
              </div>
              <p className="text-sm">
                Discover and book amazing events near you. Create memories that
                last forever.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/my-events"
                    className="hover:text-white transition-colors"
                  >
                    My Events
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Favorites
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Calendar
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Settings
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-sm">
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
              <p className="text-sm mb-2">📧 join.eventhub@gmail.com</p>
              <p className="text-sm mb-2">📞 +91 9263472616</p>
              <p className="text-sm">📍 123 Event St, NY 10001</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/contact#terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <div className="text-gray-300">
                    <span className="font-medium text-white">Privacy:</span>
                    <p className="text-xs mt-1">
                      We protect your personal data and only use it for booking
                      and communication purposes.
                    </p>
                  </div>
                </li>
                <li>
                  <div className="text-gray-300">
                    <span className="font-medium text-white">
                      Cancellation & Refunds:
                    </span>
                    <p className="text-xs mt-1 text-red-300">
                      ❌ No cancellations allowed. All sales are final.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
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
