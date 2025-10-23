"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AboutPage() {
  const { user, signOut } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      const elements = document.querySelectorAll(".animate-on-scroll");
      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (isInView && !isVisible[index]) {
          setIsVisible((prev) => ({ ...prev, [index]: true }));
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isVisible]);

  const teamMembers = [
    {
      id: 1,
      name: "Sarah Johnson",
      position: "CEO & Founder",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      bio: "Passionate about connecting people through meaningful events.",
    },
    {
      id: 2,
      name: "Mike Chen",
      position: "CTO",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      bio: "Technology enthusiast building the future of event management.",
    },
    {
      id: 3,
      name: "Emma Wilson",
      position: "Head of Marketing",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
      bio: "Creative strategist helping events reach their full potential.",
    },
    {
      id: 4,
      name: "James Brown",
      position: "Head of Operations",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      bio: "Operations expert ensuring seamless event experiences.",
    },
  ];

  const values = [
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      ),
      title: "Our Mission",
      description:
        "To connect people with unforgettable experiences and create vibrant communities through exceptional events.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      title: "Community First",
      description:
        "We believe in building strong communities through shared experiences and meaningful connections.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
          />
        </svg>
      ),
      title: "Passion Driven",
      description:
        "We are passionate about creating memorable moments and bringing people together through amazing events.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
            clipRule="evenodd"
          />
        </svg>
      ),
      title: "Innovation",
      description:
        "Constantly improving our platform to provide the best event booking and management experience.",
    },
  ];

  const stats = [
    { number: "10,000+", label: "Events Listed" },
    { number: "500,000+", label: "Happy Attendees" },
    { number: "1,000+", label: "Event Organizers" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x * 0.02 + 100,
            top: mousePosition.y * 0.02 + 100,
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute w-80 h-80 bg-linear-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse"
          style={{
            right: mousePosition.x * 0.015 + 150,
            bottom: mousePosition.y * 0.015 + 150,
            transform: "translate(50%, 50%)",
          }}
        />

        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-white">
              EventHub
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex space-x-6 xl:space-x-8">
              <Link
                href="/"
                className="text-white/80 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/events"
                className="text-white/80 hover:text-white transition-colors"
              >
                Events
              </Link>
              <Link
                href="/my-events"
                className="text-white/80 hover:text-white transition-colors"
              >
                My Events
              </Link>
              <Link href="/about" className="text-white font-medium">
                About
              </Link>
              <Link
                href="/contact"
                className="text-white/80 hover:text-white transition-colors"
              >
                Contact
              </Link>
              {/* Admin Panel Link - Only show for admins */}
              {user &&
                (user.role === "SUPER_ADMIN" ||
                  user.role === "EVENT_ADMIN") && (
                  <Link
                    href="/admin"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    🛡️ Admin Panel
                  </Link>
                )}
            </div>

            {/* Desktop Sign Out Icon - Always visible when logged in */}
            {user && (
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
                className="hidden lg:flex text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
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

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-black/40 backdrop-blur-md rounded-lg mt-2">
                <Link
                  href="/"
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/events"
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Events
                </Link>
                <Link
                  href="/my-events"
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  My Events
                </Link>
                <Link
                  href="/about"
                  className="block px-3 py-2 text-white font-medium"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Contact
                </Link>
                {/* Admin Panel Link - Only show for admins */}
                {user &&
                  (user.role === "SUPER_ADMIN" ||
                    user.role === "EVENT_ADMIN") && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mt-2"
                    >
                      🛡️ Admin Panel
                    </Link>
                  )}

                {/* Mobile Authentication - Only show on mobile screens */}
                {user && (
                  <div className="border-t border-white/20 mt-2 pt-2">
                    <div className="px-3 py-2 border-b border-white/20">
                      <p className="text-sm font-medium text-white">
                        {user.displayName || user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-white/60">{user.email}</p>
                    </div>

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
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000"
            style={{
              opacity: isVisible[0] ? 1 : 0,
              transform: isVisible[0] ? "translateY(0)" : "translateY(32px)",
            }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              About EventHub
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed px-4">
              We're on a mission to make discovering and attending events
              easier, more enjoyable, and more accessible. By bringing you to us
              or creating unforgettable memories.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div
              className="animate-on-scroll opacity-0 transition-all duration-1000 delay-200 order-2 lg:order-1 px-2 sm:px-0"
              style={{
                opacity: isVisible[1] ? 1 : 0,
                transform: isVisible[1] ? "translateX(0)" : "translateX(-50px)",
              }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 lg:mb-8 wrap-break-word">
                Our Story
              </h2>
              <div className="space-y-4 sm:space-y-5 lg:space-y-6 text-sm sm:text-base md:text-lg lg:text-xl text-white/80 leading-relaxed">
                <p className="text-left wrap-break-word">
                  EventHub was founded in 2020 with a simple vision: to create a
                  platform that brings people together through amazing events.
                  What started as a small team of event enthusiasts has grown
                  into a thriving community of event organizers and attendees.
                </p>
                <p className="text-left wrap-break-word">
                  Today, we serve thousands of users across the country, helping
                  them discover everything from intimate workshops to
                  large-scale conferences. Our platform has facilitated over
                  500,000 event bookings and continues to grow every day.
                </p>
                <p className="text-left wrap-break-word">
                  We understand the importance of event experiences as growing
                  providers, providing them with the tools they need to reach
                  their audience and create successful events.
                </p>
              </div>
            </div>
            <div
              className="animate-on-scroll opacity-0 transition-all duration-1000 delay-400 order-1 lg:order-2 px-2 sm:px-0"
              style={{
                opacity: isVisible[1] ? 1 : 0,
                transform: isVisible[1] ? "translateX(0)" : "translateX(50px)",
              }}
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <img
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop"
                  alt="Conference setup"
                  className="rounded-lg sm:rounded-xl shadow-2xl w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover hover:scale-105 transition-transform duration-300"
                />
                <img
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop"
                  alt="Event audience"
                  className="rounded-lg sm:rounded-xl shadow-2xl mt-6 sm:mt-8 lg:mt-12 w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div
              className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000"
              style={{
                opacity: isVisible[2] ? 1 : 0,
                transform: isVisible[2] ? "translateY(0)" : "translateY(32px)",
              }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                Our Values
              </h2>
              <p className="text-white/80 text-base sm:text-lg px-4">
                The principles that guide everything we do
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="animate-on-scroll opacity-0 translate-y-8 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 hover:scale-105 transform transition-all duration-1000"
                style={{
                  opacity: isVisible[3] ? 1 : 0,
                  transform: isVisible[3]
                    ? "translateY(0) scale(1)"
                    : "translateY(32px) scale(0.95)",
                  transitionDelay: `${index * 150}ms`,
                }}
              >
                <div className="text-blue-400 mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-white/80">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 md:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="animate-on-scroll opacity-0 scale-75 transition-all duration-1000"
                  style={{
                    opacity: isVisible[4] ? 1 : 0,
                    transform: isVisible[4] ? "scale(1)" : "scale(0.75)",
                    transitionDelay: `${index * 200}ms`,
                  }}
                >
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-white/80 text-sm sm:text-base lg:text-lg">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div
              className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000"
              style={{
                opacity: isVisible[5] ? 1 : 0,
                transform: isVisible[5] ? "translateY(0)" : "translateY(32px)",
              }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                Meet Our Team
              </h2>
              <p className="text-white/80 text-base sm:text-lg px-4">
                The passionate people behind EventHub
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                className="animate-on-scroll opacity-0 translate-y-8 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 p-4 sm:p-6 text-center hover:bg-white/15 hover:scale-105 transform transition-all duration-1000 group"
                style={{
                  opacity: isVisible[6] ? 1 : 0,
                  transform: isVisible[6]
                    ? "translateY(0) scale(1)"
                    : "translateY(32px) scale(0.95)",
                  transitionDelay: `${index * 150}ms`,
                }}
              >
                <div className="relative mb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-blue-300 mb-3">{member.position}</p>
                <p className="text-white/80 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-800/50 border-t border-white/10 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2">
              <Link
                href="/"
                className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 block"
              >
                EventHub
              </Link>
              <p className="text-white/60 mb-3 sm:mb-4 text-sm sm:text-base">
                Your ultimate destination for discovering and booking amazing
                events.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/events"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Browse Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-events"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    My Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Categories</h4>
              <ul className="space-y-2">
                <li>
                  <span className="text-white/60">Music</span>
                </li>
                <li>
                  <span className="text-white/60">Business</span>
                </li>
                <li>
                  <span className="text-white/60">Technology</span>
                </li>
                <li>
                  <span className="text-white/60">Sports</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-white/60">
            <p>&copy; 2025 EventHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
