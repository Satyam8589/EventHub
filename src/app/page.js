"use client";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEventStatusChecker } from "@/hooks/useEventStatusChecker";
import EventCard from "../components/EventCard";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import Navbar from "../components/Navbar";
import EventHubLogo from "../components/EventHubLogo";
import AuthStateSynchronizer from "../components/AuthStateSynchronizer";
import Link from "next/link";

// ===== UTILITY FUNCTIONS =====

// Ensure UTC format for date strings
const ensureUTCString = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes("T") && dateStr.endsWith("Z")) return dateStr;
  if (dateStr.includes("T")) return dateStr + "Z";
  return dateStr.replace(" ", "T") + "Z";
};

// Check if an event is still active (not expired)
const isEventActive = (event) => {
  const now = new Date();

  // Check if event is cancelled
  if (event.status === "CANCELLED") {
    return false;
  }

  // If event has endDate, use it to determine if event is still active
  const endDateValue = event.enddate || event.endDate;
  if (endDateValue) {
    const utcEndDate = ensureUTCString(endDateValue);
    const endDate = new Date(utcEndDate);
    return endDate > now;
  }

  // If no endDate, consider it a single-day event
  const eventDate = new Date(ensureUTCString(event.date));
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

  return eventDateOnly >= nowDateOnly;
};

// Check if event is upcoming (start date in future)
const isEventUpcoming = (event) => {
  if (event.status === "CANCELLED") return false;
  const now = new Date();
  const start = new Date(event.date);
  return start > now;
};

// ===== COMPONENTS =====

// Loading Skeleton Component - Memoized
const LoadingSkeleton = memo(({ count = 3 }) => (
  <>
    {Array(count)
      .fill()
      .map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl h-96 border border-white/20"></div>
        </div>
      ))}
  </>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

// Empty State Component - Memoized
const EmptyState = memo(({ title, description }) => (
  <div className="col-span-full text-center py-12">
    <div className="text-6xl mb-4">📅</div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
));
EmptyState.displayName = 'EmptyState';

// Animated Background Component - Memoized for performance
const AnimatedBackground = memo(({ particles, mousePosition }) => (
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
));
AnimatedBackground.displayName = 'AnimatedBackground';

// Hero Section Component - Memoized
const HeroSection = memo(({ router }) => (
  <section className="relative z-10 text-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto relative z-10">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 sm:mb-6 animate-fade-in-up leading-tight drop-shadow-2xl">
        Discover Amazing Events Near You
      </h1>
      <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-300 px-4 drop-shadow-lg">
        Join thousands of people experiencing the best events in music, food,
        technology, and community. Book your next adventure today!
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
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto">
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
          className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base backdrop-blur-sm"
        >
          Learn More
        </button>
      </div>
    </div>
  </section>
));
HeroSection.displayName = 'HeroSection';

// Stats Section Component - Memoized
const StatsSection = memo(() => {
  const stats = [
    { icon: "🎪", value: "10,000+", label: "Events Listed" },
    { icon: "👥", value: "500K+", label: "Happy Attendees" },
    { icon: "⭐", value: "4.9/5", label: "Average Rating" },
  ];

  return (
    <section className="relative z-10 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 text-center">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-6 md:p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 md:mb-4">{stat.icon}</div>
              <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
StatsSection.displayName = 'StatsSection';

// Categories Section Component - Memoized
const CategoriesSection = memo(() => {
  const categories = [
    { name: "Music", icon: "🎵", color: "from-pink-500 to-rose-500" },
    { name: "Business", icon: "💼", color: "from-blue-500 to-cyan-500" },
    { name: "Food & Drink", icon: "🍕", color: "from-orange-500 to-amber-500" },
    {
      name: "Art & Culture",
      icon: "🎨",
      color: "from-purple-500 to-indigo-500",
    },
  ];

  return (
    <section className="relative z-10 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          Explore by Category
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
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
  );
});
CategoriesSection.displayName = 'CategoriesSection';

// Events Section Component
const EventsSection = ({
  title,
  description,
  events,
  loading,
  showRefresh,
  onRefresh,
  showViewAll,
}) => (
  <section
    className={`relative z-10 py-12 sm:py-16 ${
      showRefresh ? "bg-black/20" : ""
    }`}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
          {title}
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base px-4">
          {description}
        </p>
        {showRefresh && (
          <div className="mt-3">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-colors text-sm"
              disabled={loading}
            >
              <span className="text-lg">⟳</span>
              Refresh
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {loading ? (
          <LoadingSkeleton count={3} />
        ) : events.length > 0 ? (
          events.map((event, index) => (
            <div
              key={event.id}
              style={{ animationDelay: `${index * 200}ms` }}
              className="animate-fade-in-up"
            >
              <EventCard
                event={{
                  ...event,
                  registered: event._count?.bookings || 0,
                  isExpired: false,
                }}
              />
            </div>
          ))
        ) : (
          <EmptyState
            title={`No ${title.toLowerCase()} available`}
            description="Check back soon for exciting events!"
          />
        )}
      </div>

      {showViewAll && (
        <div className="text-center mt-12">
          <a
            href="/events"
            className="inline-block bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            View All Events
          </a>
        </div>
      )}
    </div>
  </section>
);

// CTA Section Component
const CTASection = () => (
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
);

// Footer Component
const Footer = () => (
  <footer className="relative z-10 bg-black/30 backdrop-blur-md border-t border-white/10 py-12">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-gray-300">
        <div>
          <a href="/" className="cursor-pointer inline-block">
            <EventHubLogo size={32} showText={true} className="mb-4" />
          </a>
          <p className="text-sm">
            Discover and book amazing events near you. Create memories that last
            forever.
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
          <p className="text-sm">📍 Anandapur, kolkata, West Bengal</p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/terms&cond"
                className="hover:text-white transition-colors"
              >
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link
                href="/shipping&policy"
                className="hover:text-white transition-colors"
              >
                Shipping & Delivery Policy
              </Link>
            </li>
            <li>
              <Link
                href="/refund&rule"
                className="hover:text-white transition-colors"
              >
                Cancellation & Refund Policy
              </Link>
            </li>
            <li>
              <Link
                href="/privacy&policy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
        <p>&copy; 2025 EventHub. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// ===== MAIN COMPONENT =====

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [particles, setParticles] = useState([]);
  const [refreshToken, setRefreshToken] = useState(0);

  const { user, loading: authLoading, mounted } = useAuth();
  const router = useRouter();

  // Check for events that should be marked as ONGOING every 5 minutes
  useEventStatusChecker(5);

  // Handle URL parameters for login/signup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("login") === "true") {
        setShowLogin(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
      if (urlParams.get("signup") === "true") {
        setShowSignup(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [mounted]);

  // Show loading screen until component is mounted
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

  // Mouse movement effect - Throttled for performance
  useEffect(() => {
    let rafId = null;
    let lastUpdate = 0;
    const throttleMs = 16; // ~60fps

    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        lastUpdate = now;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Generate particles - Reduced count for better performance
  useEffect(() => {
    const newParticles = [...Array(30)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 2,
      animationDuration: 2 + Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/events?_=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchEvents();
  }, [refreshToken]);

  // Memoized filtered events - OPTIMIZED
  const { featuredEvents, upcomingEvents } = useMemo(() => {
    const activeEvents = events.filter(isEventActive);

    // Filter featured events (only active featured events)
    const featured = activeEvents
      .filter((event) => event.featured === true)
      .slice(0, 3);

    // For upcoming events, show next 3 strictly-upcoming (start date in future), non-featured
    const upcoming = activeEvents
      .filter((event) => event.featured !== true && isEventUpcoming(event))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);

    return { featuredEvents: featured, upcomingEvents: upcoming };
  }, [events]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshToken(Date.now());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Hero Background Image - Covers entire page */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: "url(/hero-background.png)",
            backgroundPosition: "center center",
            backgroundSize: "cover",
          }}
        />
        {/* Stronger dark overlay for better text readability across entire page */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/50" />
        {/* Color overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-transparent" />

        {/* Soft bottom gradient for footer area */}
        <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-b from-transparent via-gray-900/30 to-gray-900/70" />
      </div>

      <div className="relative z-5">
        <AnimatedBackground
          particles={particles}
          mousePosition={mousePosition}
        />
      </div>

      {/* Navigation */}
      <Navbar setShowLogin={setShowLogin} setShowSignup={setShowSignup} />

      {/* Hidden auth state synchronizer */}
      <AuthStateSynchronizer />

      {/* Hero Section */}
      <HeroSection router={router} />

      {/* Stats Section */}
      <StatsSection />

      {/* Categories Section */}
      <CategoriesSection />

      {/* Featured Events */}
      <EventsSection
        title="Featured Events"
        description="Don't miss out on these incredible experiences"
        events={featuredEvents}
        loading={loading}
        showRefresh={false}
      />

      {/* Upcoming Events */}
      <EventsSection
        title="Upcoming Events"
        description="Discover more amazing events happening soon"
        events={upcomingEvents}
        loading={loading}
        showRefresh={true}
        onRefresh={handleRefresh}
        showViewAll={true}
      />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />

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
