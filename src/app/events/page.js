"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "../../components/EventCard";
import LoginForm from "../../components/auth/LoginForm";
import SignupForm from "../../components/auth/SignupForm";
import Navbar from "../../components/Navbar";
import EventHubLogo from "../../components/EventHubLogo";

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

  const { user, loading: authLoading } = useAuth();

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
        console.log(
          "Events page: Total events fetched:",
          data.events?.length || 0
        );
        console.log(
          "Events page: Event details:",
          data.events?.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            status: e.status,
            featured: e.featured,
            hasDescription: !!e.description,
            hasLocation: !!e.location,
          }))
        );

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
    "TESTING", // Added for test events
    "CONFERENCE",
    "WORKSHOP",
    "SEMINAR",
    "NETWORKING",
    "CULTURAL",
    "EDUCATIONAL",
    "CHARITY",
    "OTHER",
  ];

  // Filter events based on search and category
  const filteredEvents = events
    .filter((event) => {
      try {
        const matchesSearch =
          event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategory === "All Categories" ||
          event.category === selectedCategory;

        // Check if event is not expired - proper event lifecycle filtering
        const currentDate = new Date();
        const isNotExpired = (() => {
          // If event has an end date, check if it's not past the end date (event is still running or upcoming)
          const endDateValue = event.endDate || event.enddate;
          if (endDateValue) {
            return new Date(endDateValue) >= currentDate;
          } else {
            // If no end date, consider it a single-day event - show if it's today or in the future
            const eventDate = new Date(event.date);
            const eventDateOnly = new Date(
              eventDate.getFullYear(),
              eventDate.getMonth(),
              eventDate.getDate()
            );
            const currentDateOnly = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate()
            );
            return eventDateOnly >= currentDateOnly;
          }
        })();

        const result = matchesSearch && matchesCategory && isNotExpired;

        if (process.env.NODE_ENV === "development") {
          console.log("Event filter:", {
            title: event.title,
            matchesSearch,
            matchesCategory,
            isNotExpired,
            eventDate: event.date,
            endDate: event.endDate,
            result,
          });
        }

        return result;
      } catch (err) {
        console.error("Error filtering event:", event, err);
        return false; // Exclude events that cause errors
      }
    })
    .sort((a, b) => {
      // Sort featured events first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      // If both are featured or both are not featured, maintain original order
      return 0;
    });

  console.log("Events page - Total events:", events.length);
  console.log("Events page - Filtered events:", filteredEvents.length);
  console.log("Events page - Loading state:", loading);
  console.log("Events page - Error state:", error);
  console.log(
    "Events page - Events data:",
    events.map((e) => ({ id: e.id, title: e.title }))
  );
  console.log(
    "Events page - Filtered data:",
    filteredEvents.map((e) => ({ id: e.id, title: e.title }))
  );

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

      {/* Header Section */}
      <div className="relative z-10 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 md:mb-4">
              Discover Events
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
              Explore our calendar of amazing events
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/20">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-300 text-lg">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
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
                  className="flex-1 px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
              </div>

              {/* More Filters Button - Mobile Optimized */}
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Results Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3 sm:gap-0">
          <p className="text-gray-300 text-sm sm:text-base">
            <span className="font-medium text-white text-base sm:text-lg">
              {filteredEvents.length} Events Found
            </span>
          </p>
          <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
            <span>⚙️</span>
            <span>More Filters</span>
          </button>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Loading events...
            </h3>
            <p className="text-gray-300 text-sm sm:text-base">
              Please wait while we fetch the latest events
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Error loading events
            </h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <EventCard
                  event={{
                    ...event,
                    registered: event._count?.bookings || 0,
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="text-5xl sm:text-6xl mb-4">🔍</div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Try adjusting your search criteria or browse all categories
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All Categories");
                setSelectedDate("");
              }}
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-colors text-sm sm:text-base"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Load More Button */}
        {filteredEvents.length > 0 && (
          <div className="text-center mt-8 md:mt-12">
            <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm sm:text-base">
              Load More Events
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <a href="/" className="cursor-pointer inline-block">
                <EventHubLogo size={32} showText={true} className="mb-4" />
              </a>
              <p className="text-gray-400 text-sm">
                Your premium destination for discovering and booking amazing
                events
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-base">
                Quick Links
              </h4>
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
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-base">
                Categories
              </h4>
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
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-base">
                Contact Us
              </h4>
              <p className="text-gray-400 text-sm mb-2 wrap-break-word">
                📧 join.eventhub@gmail.com
              </p>
              <p className="text-gray-400 text-sm mb-2">📞 +91 9263472616</p>
              <p className="text-gray-400 text-sm">📍 123 Event St, NY 10001</p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm text-gray-400">
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
