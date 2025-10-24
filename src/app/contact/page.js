"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function ContactPage() {
  const { user, signOut } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null, 'success', 'error'
  const [aiResponse, setAiResponse] = useState(null);

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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setAiResponse(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Success!
        setSubmitStatus("success");
        setAiResponse(data.aiResponse);

        // Reset form
        setFormData({ name: "", email: "", subject: "", message: "" });

        // Scroll to show the response
        setTimeout(() => {
          document.getElementById("response-section")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      } else {
        // Error from API
        setSubmitStatus("error");
        console.error("API error:", data.error);
      }
    } catch (error) {
      // Network or other error
      setSubmitStatus("error");
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {[...Array(12)].map((_, i) => (
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
              <Link
                href="/about"
                className="text-white/80 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link href="/contact" className="text-white font-medium">
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
                  className="block px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="block px-3 py-2 text-white font-medium"
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
              Contact Us
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed px-4">
              Have a question or need help? We'd love to hear from you. Send us
              a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="relative z-10 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16">
            {/* Contact Information */}
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              <div
                className="animate-on-scroll opacity-0 transition-all duration-1000"
                style={{
                  opacity: isVisible[1] ? 1 : 0,
                  transform: isVisible[1]
                    ? "translateX(0)"
                    : "translateX(-20px)",
                }}
              >
                {/* Email */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl border border-white/20 p-4 sm:p-6 md:p-8 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors shrink-0">
                      <svg
                        className="w-6 h-6 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                        Email
                      </h3>
                      <p className="text-white/80 text-sm sm:text-base break-all">
                        join.eventhub@gmail.com
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl border border-white/20 p-4 sm:p-6 md:p-8 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors shrink-0">
                      <svg
                        className="w-6 h-6 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                        Phone
                      </h3>
                      <p className="text-white/80 text-sm sm:text-base">
                        +91 9263472616
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl border border-white/20 p-4 sm:p-6 md:p-8 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors shrink-0">
                      <svg
                        className="w-6 h-6 text-purple-400"
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
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                        Address
                      </h3>
                      <p className="text-white/80 text-sm sm:text-base">
                        123 Event Street, New York, NY
                        <br />
                        10001
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="bg-white/5 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
                    Business Hours
                  </h3>
                  <div className="space-y-2 text-white/80 text-sm sm:text-base">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span className="text-red-400">Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div
              className="animate-on-scroll opacity-0 transition-all duration-1000"
              style={{
                opacity: isVisible[2] ? 1 : 0,
                transform: isVisible[2] ? "translateX(0)" : "translateX(20px)",
              }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl border border-white/20 p-4 sm:p-6 md:p-8">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Send us a message
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base">
                    Fill out the form below and we'll get back to you within 24
                    hours.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@domain.com"
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="How can we help?"
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us more about your inquiry..."
                      rows={4}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-md transition-all duration-300 resize-none text-sm sm:text-base"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-sm sm:text-base"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending Message...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Send Message
                      </div>
                    )}
                  </button>

                  {/* Success Message */}
                  {submitStatus === "success" && (
                    <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                      <div className="flex items-center text-green-400">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-semibold">
                          Message sent successfully!
                        </span>
                      </div>
                      <p className="text-green-300 text-sm mt-2">
                        Thank you for contacting us. We'll respond within 24
                        hours.
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {submitStatus === "error" && (
                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <div className="flex items-center text-red-400">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-semibold">
                          Failed to send message
                        </span>
                      </div>
                      <p className="text-red-300 text-sm mt-2">
                        Please try again or contact us directly at
                        join.eventhub@gmail.com
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Response Section */}
      {aiResponse && (
        <section id="response-section" className="relative z-10 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 sm:p-8 animate-fadeIn">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    AI-Powered Response
                  </h3>
                  <p className="text-white/70 text-sm">
                    Generated by Gemini AI • Instant assistance
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                    {aiResponse}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Our team will review your message and provide a detailed
                  response within 24 hours.
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Terms and Conditions Section */}
      <section id="terms" className="relative z-10 py-12 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-white/10 p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Terms and Conditions
            </h2>

            <div className="space-y-6 text-white/80 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  1. Acceptance of Terms
                </h3>
                <p>
                  By accessing and using EventHub, you accept and agree to be
                  bound by the terms and provision of this agreement.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  2. Event Booking and Payment
                </h3>
                <p>
                  All event bookings are subject to availability. Payment must
                  be made in full at the time of booking. We accept all major
                  credit cards and digital payment methods.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  3. Cancellation and Refund Policy
                </h3>
                <p className="text-red-300 font-medium">
                  ⚠️ Important: All ticket sales are final. No cancellations or
                  refunds are allowed once a booking is confirmed. Please review
                  your booking details carefully before completing your
                  purchase.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  4. Event Changes
                </h3>
                <p>
                  Event organizers reserve the right to modify event details
                  including date, time, venue, or cancel events. In case of
                  cancellation by the organizer, full refunds will be provided.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  5. User Conduct
                </h3>
                <p>
                  Users must provide accurate information and comply with all
                  event rules and regulations. Inappropriate behavior may result
                  in account suspension.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  6. Privacy Policy
                </h3>
                <p>
                  We respect your privacy and are committed to protecting your
                  personal data. We collect only necessary information for
                  booking and communication purposes. Your data will not be
                  shared with third parties without consent.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  7. Limitation of Liability
                </h3>
                <p>
                  EventHub acts as a platform connecting users with event
                  organizers. We are not liable for any damages or issues
                  arising from events themselves.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  8. Contact Information
                </h3>
                <p>
                  For any questions regarding these terms, please contact us at{" "}
                  <a
                    href="mailto:legal@eventhub.com"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    legal@eventhub.com
                  </a>
                </p>
              </div>

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-sm text-white/60">
                  Last updated: October 24, 2025
                </p>
              </div>
            </div>
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
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-white/60">
                  <svg
                    className="w-4 h-4 mr-2"
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
                  </svg>
                  123 Event Street, NY 10001
                </li>
                <li className="flex items-center text-white/60">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  join.eventhub@gmail.com
                </li>
                <li className="flex items-center text-white/60">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  +91 9263472616
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
