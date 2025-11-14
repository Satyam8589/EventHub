"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RefundCancellationPage() {
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

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-black/40 backdrop-blur-md rounded-lg mt-2">
                <Link href="/" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
                  Home
                </Link>
                <Link href="/events" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
                  Events
                </Link>
                <Link href="/my-events" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
                  My Events
                </Link>
                <Link href="/about" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/contact" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
                  Contact
                </Link>
                {user && (user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN") && (
                  <Link href="/admin" className="block px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mt-2">
                    🛡️ Admin Panel
                  </Link>
                )}
                {user && (
                  <div className="border-t border-white/20 mt-2 pt-2">
                    <button
                      onClick={async () => {
                        try {
                          const result = await signOut();
                          if (!result.error) {
                            setMobileMenuOpen(false);
                            window.location.reload();
                          }
                        } catch (error) {
                          console.error("Error signing out:", error);
                        }
                      }}
                      className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
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
              Refund & Cancellation Policy
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
            
            {/* Important Notice */}
            <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-300 mb-2">Important: No Cancellation Policy</h3>
                  <p className="text-red-200 leading-relaxed">
                    All ticket purchases on EventHub are <strong>non-cancellable and non-refundable</strong> once the booking is confirmed and payment is processed. Please review your booking details carefully before completing your purchase.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">1. No Cancellation Policy</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  EventHub operates a strict <strong className="text-white">no cancellation</strong> policy for all ticket bookings. Once you complete your booking and receive payment confirmation, your purchase is final and cannot be cancelled, modified, or refunded under normal circumstances.
                </p>
                <p>This policy applies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All event types (concerts, sports, conferences, workshops, etc.)</li>
                  <li>All ticket categories (general admission, VIP, early bird, etc.)</li>
                  <li>Both free and paid events</li>
                  <li>Single and multiple ticket purchases</li>
                </ul>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">2. Why We Have This Policy</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>Our no-cancellation policy exists because:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Tickets are allocated from a limited inventory</li>
                  <li>Event organizers rely on confirmed attendance for planning</li>
                  <li>Last-minute cancellations prevent others from purchasing tickets</li>
                  <li>Payment processing fees are non-recoverable</li>
                  <li>Digital tickets are delivered immediately upon purchase</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">3. Booking Issues - 48 Hour Resolution</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  If you experience technical or payment issues during the booking process, we will investigate and resolve your concern within <strong className="text-white">48 business hours</strong>.
                </p>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
                  <h3 className="text-lg font-semibold text-blue-300">Eligible Booking Issues Include:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-blue-200">
                    <li>Payment was debited but no booking confirmation received</li>
                    <li>Duplicate charges for the same booking</li>
                    <li>Technical error during checkout that prevented booking completion</li>
                    <li>Incorrect ticket details due to system error</li>
                    <li>Payment gateway failure or timeout issues</li>
                  </ul>
                </div>

                <p className="mt-4">
                  <strong className="text-white">How to Report Booking Issues:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Email us at join.eventhub@gmail.com within 24 hours of the issue</li>
                  <li>Include your transaction ID, booking reference, and payment screenshot</li>
                  <li>Describe the issue in detail</li>
                  <li>Our support team will investigate and respond within 48 hours</li>
                </ol>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">4. Event Cancellation by Organizer</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  If an event is cancelled by the event organizer, you will receive a <strong className="text-white">full refund</strong> including any applicable fees.
                </p>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Refund Process for Cancelled Events:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Automatic email notification of event cancellation</li>
                    <li>Refund processed to original payment method</li>
                    <li>Refund timeline: 7-10 business days</li>
                    <li>No action required from your side</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">5. Event Postponement or Rescheduling</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  If an event is postponed or rescheduled to a new date:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your tickets remain valid for the new date</li>
                  <li><strong className="text-white">No refunds will be issued</strong> for rescheduled events</li>
                  <li>You will receive email notification of the new date and time</li>
                  <li>If you cannot attend the rescheduled event, tickets are non-refundable</li>
                </ul>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                  <p className="text-yellow-200">
                    <strong>Note:</strong> Some event organizers may offer refunds for rescheduled events at their discretion. This will be communicated separately if applicable.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">6. What We Cannot Refund</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>Refunds are not available for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Change of mind or personal scheduling conflicts</li>
                  <li>Inability to attend the event for any reason</li>
                  <li>Lost or misplaced tickets (digital tickets can be re-downloaded)</li>
                  <li>Incorrect ticket selection or quantity (review before purchasing)</li>
                  <li>Dissatisfaction with the event experience</li>
                  <li>Weather-related issues (unless event is officially cancelled)</li>
                  <li>Travel or accommodation costs</li>
                  <li>Personal emergencies or medical situations</li>
                </ul>
              </div>
            </div>

            {/* Section 7 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">7. Ticket Transfer</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>
                  While we do not offer cancellations, some tickets may be transferable to another person:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Check if your ticket allows transfers (indicated during purchase)</li>
                  <li>Transfer requests must be made at least 48 hours before the event</li>
                  <li>Contact support with transferee details</li>
                  <li>Transfer fees may apply (if applicable)</li>
                  <li>Original purchaser remains responsible for ticket usage</li>
                </ul>
                <p className="mt-3">
                  <strong className="text-white">Note:</strong> Not all events allow ticket transfers. This is determined by the event organizer.
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">8. Refund Processing Timeline</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>When refunds are approved (for eligible cases only):</p>
                
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Credit/Debit Cards:</h3>
                    <p>5-7 business days after refund initiation</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Net Banking:</h3>
                    <p>5-7 business days after refund initiation</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">UPI:</h3>
                    <p>3-5 business days after refund initiation</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Wallets:</h3>
                    <p>24-48 hours after refund initiation</p>
                  </div>
                </div>

                <p className="mt-4 text-sm">
                  Refund timelines may vary depending on your bank or payment provider. If you don't receive your refund within the specified timeframe, please contact your bank first, then reach out to our support team.
                </p>
              </div>
            </div>

            {/* Section 9 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">9. Fraudulent Bookings</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>
                  We reserve the right to cancel bookings and issue refunds if we detect:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fraudulent payment information</li>
                  <li>Violation of terms and conditions</li>
                  <li>Unauthorized use of payment methods</li>
                  <li>Bot or automated booking attempts</li>
                  <li>Bulk buying for resale (scalping)</li>
                </ul>
                <p className="mt-3">
                  In such cases, we may also take legal action and ban accounts permanently.
                </p>
              </div>
            </div>

            {/* Section 10 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">10. Contact Us for Issues</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>If you experience any booking issues or have questions about this policy, contact us immediately:</p>
                <div className="bg-white/5 rounded-lg p-4 sm:p-6 mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-white">Email</p>
                      <p>join.eventhub@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-white">Phone</p>
                      <p>+91 9263472616</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-white">Support Hours</p>
                      <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                      <p>Saturday: 10:00 AM - 4:00 PM IST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-white">Response Time</p>
                      <p>We respond to all inquiries within 48 business hours</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
                  <p className="text-blue-200">
                    <strong>Pro Tip:</strong> Always include your booking ID, transaction reference, and registered email address when contacting support for faster resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 11 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">11. Policy Updates</h2>
              <p className="text-white/80 leading-relaxed">
                We reserve the right to modify this Refund and Cancellation Policy at any time. Changes will be effective immediately upon posting on our website. We encourage you to review this policy before making any booking. Your continued use of our platform after changes indicates acceptance of the updated policy.
              </p>
            </div>

            {/* Final Note */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">Before You Book - Please Note:</h3>
              <ul className="text-white/90 space-y-2 leading-relaxed">
                <li>✓ Review all event details carefully</li>
                <li>✓ Verify the date, time, and venue</li>
                <li>✓ Check ticket type and quantity</li>
                <li>✓ Confirm you can attend before purchasing</li>
                <li>✓ Save your booking confirmation email</li>
                <li>✓ Download your digital tickets immediately</li>
              </ul>
            </div>

            {/* Back Button */}
            <div className="pt-8 border-t border-white/20">
              <Link href="/" className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
              <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}