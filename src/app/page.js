"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import EventCard from "../components/EventCard";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import Navbar from "../components/Navbar";
import EventHubLogo from "../components/EventHubLogo";
import AuthStateSynchronizer from "../components/AuthStateSynchronizer";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [particles, setParticles] = useState([]);

  const { user, loading: authLoading, mounted } = useAuth();
  const router = useRouter();

  // Show loading screen until component is mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Close modals when user becomes authenticated
  useEffect(() => {
    if (user && !authLoading) {
      setShowLogin(false);
      setShowSignup(false);
    }
  }, [user, authLoading]);

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
        console.log("Fetching events from /api/events...");
        const response = await fetch(`/api/events?_=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(
            `Failed to fetch events: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        console.log("Events data received:", data);
        const allEvents = data.events || [];
        console.log("Total events fetched:", allEvents.length);

        if (allEvents.length === 0) {
          console.warn(
            "No events found in database. This might be a deployment issue."
          );
        }

        setEvents(allEvents);

        // Helper function to check if an event is still active (not expired)
        const isEventActive = (event) => {
          const now = new Date();

          console.log(`🔍 Checking event "${event.title}":`, {
            date: event.date,
            endDate: event.endDate,
            status: event.status,
            featured: event.featured,
          });

          // Check if event is cancelled
          if (event.status === "CANCELLED") {
            console.log(`❌ Event "${event.title}" is CANCELLED`);
            return false;
          }

          // If event has endDate, use it to determine if event is still active
          const endDateValue = event.endDate || event.enddate;
          if (endDateValue) {
            const endDate = new Date(endDateValue);
            // Be more strict - only show if end date is clearly in the future
            const isActive = endDate > now;
            console.log(
              `🗓️ Multi-day event "${
                event.title
              }": endDate=${endDate.toISOString()}, now=${now.toISOString()}, active=${isActive}`
            );
            return isActive;
          }

          // If no endDate, consider it a single-day event
          const eventDate = new Date(event.date);
          // Be more strict - only show if event date is today or future
          const eventDateOnly = new Date(
            eventDate.getFullYear(),
            eventDate.getMonth(),
            eventDate.getDate()
          );
          const nowDateOnly = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          const isActive = eventDateOnly >= nowDateOnly;
          console.log(
            `📅 Single-day event "${
              event.title
            }": eventDate=${eventDateOnly.toISOString()}, nowDate=${nowDateOnly.toISOString()}, active=${isActive}`
          );

          return isActive;
        };

        // Filter featured events (only active featured events)
        const featured = allEvents
          .filter((event) => event.featured === true && isEventActive(event))
          .slice(0, 3);
        console.log("Featured events:", featured.length);

        setFeaturedEvents(featured);
        console.log("Total featured events to display:", featured.length);

        // For upcoming events, show latest non-featured active events
        const nonFeatured = allEvents.filter(
          (event) => event.featured !== true && isEventActive(event)
        );
        setUpcomingEvents(nonFeatured.slice(0, 3));
        console.log(
          "Upcoming events to display:",
          nonFeatured.slice(0, 3).length
        );
      } catch (error) {
        console.error("Error fetching events:", error);
        console.error("Error details:", error.message);
        console.error("This error occurred in production. Please check:");
        console.error("1. /api/events endpoint is accessible");
        console.error("2. Environment variables are set correctly");
        console.error("3. Database connection is working");
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
      <Navbar setShowLogin={setShowLogin} setShowSignup={setShowSignup} />

      {/* Hidden auth state synchronizer */}
      <AuthStateSynchronizer />

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
            <button
              onClick={() => router.push("/events")}
              className="bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base"
            >
              Browse Events
            </button>
            <button
              onClick={() => router.push("/about")}
              className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
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
            {loading ? (
              Array(3)
                .fill()
                .map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl h-96 border border-white/20"></div>
                  </div>
                ))
            ) : featuredEvents.length > 0 ? (
              featuredEvents.map((event, index) => (
                <div
                  key={event.id}
                  style={{ animationDelay: `${index * 200}ms` }}
                  className="animate-fade-in-up"
                >
                  <EventCard
                    event={{
                      ...event,
                      registered: event._count?.bookings || 0,
                      featured: true,
                      isExpired: false, // Home page only shows active events
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No featured events available
                </h3>
                <p className="text-gray-300">
                  Check back soon for exciting events!
                </p>
              </div>
            )}
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
            {loading ? (
              Array(3)
                .fill()
                .map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl h-96 border border-white/20"></div>
                  </div>
                ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => (
                <div
                  key={event.id}
                  style={{ animationDelay: `${index * 200}ms` }}
                  className="animate-fade-in-up"
                >
                  <EventCard
                    event={{
                      ...event,
                      registered: event._count?.bookings || 0,
                      featured: false,
                      isExpired: false, // Home page only shows active events
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No upcoming events available
                </h3>
                <p className="text-gray-300">
                  Check back soon for exciting events!
                </p>
              </div>
            )}
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
              <a href="/" className="cursor-pointer inline-block">
                <EventHubLogo size={32} showText={true} className="mb-4" />
              </a>
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
