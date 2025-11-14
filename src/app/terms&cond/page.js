"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function TermsConditionsPage() {
  const { user, signOut } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();

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
    handleScroll();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isVisible]);

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

            {user && (
              <button
                onClick={() => router.back()}
                className="hidden lg:flex text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="Go Back"
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
                    d="M17 16l-4-4m0 0l4-4m-4 4h14"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000"
            style={{
              opacity: isVisible[0] ? 1 : 0,
              transform: isVisible[0] ? "translateY(0)" : "translateY(32px)",
            }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Terms & Conditions
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Last Updated: November 14, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative z-10 py-8 sm:py-12 md:py-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 sm:p-8 md:p-12 space-y-8">
            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                1. Acceptance of Terms
              </h2>
              <p className="text-white/80 leading-relaxed">
                By accessing and using EventHub's online ticket booking
                platform, you accept and agree to be bound by the terms and
                conditions of this agreement. If you do not agree to these
                terms, please do not use our services.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                2. Service Description
              </h2>
              <p className="text-white/80 leading-relaxed">
                EventHub provides an online platform for booking event tickets
                digitally. All tickets are delivered electronically via email or
                through your account dashboard. We do not provide physical
                ticket delivery services.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                3. User Account
              </h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>
                  To book tickets, you must create an account with accurate
                  information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    You are responsible for maintaining the confidentiality of
                    your account credentials
                  </li>
                  <li>
                    You must be at least 18 years old to create an account
                  </li>
                  <li>
                    You agree to notify us immediately of any unauthorized
                    access to your account
                  </li>
                  <li>One account per user is permitted</li>
                </ul>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                4. Ticket Booking
              </h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>When booking tickets through our platform:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All sales are final once payment is confirmed</li>
                  <li>
                    Ticket prices are displayed in INR and include applicable
                    taxes
                  </li>
                  <li>Tickets are subject to availability</li>
                  <li>
                    We reserve the right to limit ticket quantities per user
                  </li>
                  <li>
                    Promotional codes cannot be combined with other offers
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                5. Payment Terms
              </h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>Payment processing is handled securely through Razorpay:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    We accept credit cards, debit cards, UPI, and net banking
                  </li>
                  <li>All transactions are encrypted and secure</li>
                  <li>
                    Payment must be completed within 15 minutes of booking
                    initiation
                  </li>
                  <li>
                    Failed transactions will automatically release the reserved
                    tickets
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                6. Digital Ticket Delivery
              </h2>
              <p className="text-white/80 leading-relaxed">
                Since all tickets are delivered digitally, there is no shipping
                policy. Tickets will be sent to your registered email address
                and available in your account dashboard immediately after
                successful payment confirmation.
              </p>
            </div>

            {/* Section 7 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                7. Prohibited Activities
              </h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>Users are strictly prohibited from:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Reselling tickets at inflated prices (scalping)</li>
                  <li>Using automated bots to purchase tickets</li>
                  <li>Creating multiple accounts to bypass purchase limits</li>
                  <li>Sharing account credentials with others</li>
                  <li>Attempting to manipulate or hack the platform</li>
                </ul>
              </div>
            </div>

            {/* Section 8 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                8. Event Changes and Cancellations
              </h2>
              <p className="text-white/80 leading-relaxed">
                If an event is postponed, rescheduled, or cancelled by the
                organizer, we will notify you via email. Refund policies for
                such situations are governed by our Refund and Cancellation
                Policy.
              </p>
            </div>

            {/* Section 9 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                9. Limitation of Liability
              </h2>
              <p className="text-white/80 leading-relaxed">
                EventHub acts as an intermediary platform between event
                organizers and attendees. We are not responsible for the
                quality, safety, or legality of events listed on our platform.
                Our liability is limited to the ticket price paid.
              </p>
            </div>

            {/* Section 10 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                10. Intellectual Property
              </h2>
              <p className="text-white/80 leading-relaxed">
                All content on EventHub, including logos, designs, text,
                graphics, and software, is the property of EventHub and
                protected by copyright laws. Unauthorized use is strictly
                prohibited.
              </p>
            </div>

            {/* Section 11 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                11. Modifications to Terms
              </h2>
              <p className="text-white/80 leading-relaxed">
                We reserve the right to modify these terms at any time. Changes
                will be effective immediately upon posting. Continued use of the
                platform after changes constitutes acceptance of modified terms.
              </p>
            </div>

            {/* Section 12 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                12. Governing Law
              </h2>
              <p className="text-white/80 leading-relaxed">
                These terms are governed by the laws of India. Any disputes
                arising from these terms shall be subject to the exclusive
                jurisdiction of courts in West Bengal, India.
              </p>
            </div>

            {/* Section 13 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                13. Contact Information
              </h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>For questions about these terms, please contact us:</p>
                <div className="bg-white/5 rounded-lg p-4 mt-4 space-y-2">
                  <p>
                    <strong className="text-white">Email:</strong>{" "}
                    join.eventhub@gmail.com
                  </p>
                  <p>
                    <strong className="text-white">Phone:</strong> +91
                    9263472616
                  </p>
                  <p>
                    <strong className="text-white">Address:</strong> 123 Event
                    Street, New York, NY 10001
                  </p>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-8 border-t border-white/20">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
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
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-800/50 border-t border-white/10 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-white/60">
            <p>&copy; 2025 EventHub. All rights reserved.</p>
            <div className="mt-4 space-x-4">
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/refund"
                className="hover:text-white transition-colors"
              >
                Refund Policy
              </Link>
              <Link
                href="/contact"
                className="hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
