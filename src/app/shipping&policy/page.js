"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShippingPolicyPage() {
  const [user] = useState(null); // Mock user state
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
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x * 0.02 + 100,
            top: mousePosition.y * 0.02 + 100,
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute w-80 h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse"
          style={{
            right: mousePosition.x * 0.015 + 150,
            bottom: mousePosition.y * 0.015 + 150,
            transform: "translate(50%, 50%)",
          }}
        />

        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
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
            <a href="/" className="text-xl sm:text-2xl font-bold text-white">
              EventHub
            </a>

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
              Shipping & Delivery Policy
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Digital Ticket Delivery Information
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative z-10 py-8 sm:py-12 md:py-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 sm:p-8 md:p-12 space-y-8">
            
            {/* Important Notice */}
            <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-300 mb-2">Digital Delivery Only - No Physical Shipping</h3>
                  <p className="text-blue-200 leading-relaxed">
                    EventHub is an <strong>online ticket booking platform</strong> that provides <strong>digital tickets only</strong>. We do not ship physical tickets or any tangible products. All tickets are delivered electronically via email immediately after successful payment.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">1. No Physical Shipping</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  EventHub is a <strong className="text-white">100% digital platform</strong>. We do not offer physical ticket shipping or delivery services because:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All tickets are generated and delivered digitally</li>
                  <li>Digital delivery is instant and environmentally friendly</li>
                  <li>No physical tickets are printed or mailed</li>
                  <li>No shipping charges or delivery fees apply</li>
                  <li>Tickets are accessible from anywhere via email or account dashboard</li>
                </ul>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">2. Digital Ticket Delivery Process</h2>
              <div className="text-white/80 leading-relaxed space-y-4">
                <p>Here's how you receive your tickets after booking:</p>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 border-l-4 border-blue-500">
                    <h3 className="text-lg font-semibold text-white mb-2">Step 1: Complete Payment</h3>
                    <p>After successful payment processing through Razorpay, your booking is confirmed instantly.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border-l-4 border-green-500">
                    <h3 className="text-lg font-semibold text-white mb-2">Step 2: Instant Email Delivery</h3>
                    <p>Within seconds, you receive a confirmation email containing:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                      <li>Booking confirmation number</li>
                      <li>Digital ticket(s) with QR code</li>
                      <li>Event details (date, time, venue)</li>
                      <li>Payment receipt</li>
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border-l-4 border-purple-500">
                    <h3 className="text-lg font-semibold text-white mb-2">Step 3: Access via Dashboard</h3>
                    <p>Tickets are also available in your account dashboard under "My Events" section for easy access anytime.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">3. Delivery Timeline</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="text-xl font-bold text-white">Instant Delivery (0-5 Minutes)</h3>
                  </div>
                  <p className="text-green-200">
                    Digital tickets are delivered to your registered email address within 0-5 minutes after successful payment confirmation. In most cases, delivery is instant.
                  </p>
                </div>

                <p className="mt-4">
                  <strong className="text-white">What if I don't receive tickets within 5 minutes?</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Check your spam/junk folder</li>
                  <li>Verify the email address used during booking</li>
                  <li>Log in to your EventHub account and check "My Events"</li>
                  <li>Contact support if tickets are not visible after 15 minutes</li>
                </ul>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">4. How to Access Your Digital Tickets</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>You can access your tickets through multiple channels:</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <h3 className="font-semibold text-white">Email</h3>
                    </div>
                    <p className="text-sm">Check your inbox for the confirmation email with ticket attachments</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h3 className="font-semibold text-white">Account Dashboard</h3>
                    </div>
                    <p className="text-sm">Log in and navigate to "My Events" to view all your bookings</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <h3 className="font-semibold text-white">Mobile Access</h3>
                    </div>
                    <p className="text-sm">Access via mobile browser or save tickets to your phone gallery</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <h3 className="font-semibold text-white">Print Option</h3>
                    </div>
                    <p className="text-sm">Download and print tickets at home if preferred (optional)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">5. Digital Ticket Features</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>Each digital ticket includes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Unique QR Code:</strong> For quick venue entry scanning</li>
                  <li><strong className="text-white">Booking ID:</strong> Unique identification number</li>
                  <li><strong className="text-white">Event Information:</strong> Date, time, venue, seat details</li>
                  <li><strong className="text-white">Attendee Details:</strong> Name and ticket category</li>
                  <li><strong className="text-white">Terms & Conditions:</strong> Event-specific guidelines</li>
                  <li><strong className="text-white">Contact Information:</strong> Support details for queries</li>
                </ul>
              </div>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">6. Lost or Misplaced Tickets</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  Since tickets are digital, you can easily retrieve them if lost:
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-yellow-300">Easy Retrieval Options:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-yellow-200">
                    <li>Search your email inbox for "EventHub" or booking ID</li>
                    <li>Log in to your account and download from "My Events"</li>
                    <li>Request a resend via support (tickets are never "lost" in our system)</li>
                    <li>Access from any device with your login credentials</li>
                  </ul>
                </div>
                <p className="mt-4">
                  <strong className="text-white">Note:</strong> Physical ticket reprinting or replacement fees do not apply since we only provide digital tickets.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">7. Venue Entry Requirements</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>To enter the event venue:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Present your digital ticket on your mobile device (recommended)</li>
                  <li>OR bring a printed copy of your ticket</li>
                  <li>Ensure the QR code is clearly visible for scanning</li>
                  <li>Carry a valid photo ID matching the ticket holder's name</li>
                  <li>Arrive at the venue with sufficient time before event start</li>
                </ul>
              </div>
            </div>

            {/* Section 8 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">8. Email Delivery Issues</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  If you don't receive your ticket email:
                </p>

                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Check Spam/Junk Folder</h3>
                    <p>Sometimes confirmation emails are filtered as spam. Add join.eventhub@gmail.com to your contacts.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Verify Email Address</h3>
                    <p>Ensure you entered the correct email during booking. Check for typos.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Check Account Dashboard</h3>
                    <p>Tickets are always available in your EventHub account regardless of email delivery.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Contact Support</h3>
                    <p>If tickets are not accessible after 15 minutes, email us at join.eventhub@gmail.com with your booking ID.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 9 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">9. Multiple Ticket Bookings</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>
                  When you book multiple tickets in a single transaction:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All tickets are sent to the email address of the person who made the booking</li>
                  <li>Each ticket has a unique QR code for individual entry</li>
                  <li>You can forward individual tickets to other attendees via email</li>
                  <li>All tickets can also be accessed from the booker's account dashboard</li>
                  <li>Group bookings follow the same digital delivery process</li>
                </ul>
              </div>
            </div>

            {/* Section 10 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">10. Environmental Benefits</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>
                  Our digital-only approach provides several benefits:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Zero paper waste from printing</li>
                  <li>No carbon emissions from shipping/delivery</li>
                  <li>Instant access without waiting for postal delivery</li>
                  <li>Cost savings passed on to customers (no delivery charges)</li>
                  <li>Secure and tamper-proof digital verification</li>
                </ul>
              </div>
            </div>

            {/* Section 11 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">11. Support for Delivery Issues</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>If you experience any issues receiving your digital tickets:</p>
                <div className="bg-white/5 rounded-lg p-4 sm:p-6 mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-white">Email Support</p>
                      <p>join.eventhub@gmail.com</p>
                      <p className="text-sm text-white/60 mt-1">Response within 48 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-white">Phone Support</p>
                      <p className="text-sm text-white/60 mt-1">Mon-Fri: 9 AM - 6 PM IST</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                  <p className="text-blue-200">
                    <strong>Remember:</strong> Always include your booking ID and registered email address when contacting support for faster assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/30 backdrop-blur-md border-t border-white/20 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/60 text-sm">
            ©️ {new Date().getFullYear()} EventHub. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
