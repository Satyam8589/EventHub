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
              Cancellation & Refund Policy
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Last Updated: November 15, 2025
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
                  <h3 className="text-xl font-bold text-red-300 mb-2">No Cancellation Policy</h3>
                  <p className="text-red-200 leading-relaxed">
                    EventHub operates a strict <strong>NO CANCELLATION</strong> policy for all event registrations. Once you complete your registration and payment is confirmed, the transaction is final and <strong>non-refundable under normal circumstances</strong>. Please review all event details carefully before completing your registration.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">1. Overview</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  This Cancellation and Refund Policy governs all transactions made through EventHub, an event management and registration platform. By registering for any event and completing payment, you acknowledge that you have read, understood, and agree to be bound by this policy.
                </p>
                <p>
                  <strong className="text-white">Service Description:</strong> EventHub provides an online platform for event organizers to host and manage events including conferences, workshops, seminars, cultural programs, educational events, and other legitimate gatherings. Users can discover events, complete registration, and receive digital access passes.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">2. No Cancellation Policy</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  All event registrations made through EventHub are <strong className="text-white">non-cancellable and non-refundable</strong> once payment has been successfully processed and booking confirmation has been issued.
                </p>
                
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <h3 className="text-lg font-semibold text-white">This Policy Applies To:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All event types and categories</li>
                    <li>All registration/ticket categories (General, VIP, Student, etc.)</li>
                    <li>Both free and paid events</li>
                    <li>Single and multiple registration purchases</li>
                    <li>Early bird, regular, and last-minute registrations</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                  <p className="text-yellow-200">
                    <strong>Important:</strong> Users cannot cancel their registration or request refunds due to personal reasons including change of plans, scheduling conflicts, inability to attend, or any other personal circumstances.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">3. Technical/Payment Issues - 48 Hour Resolution</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  If you experience genuine technical or payment-related problems during the registration process, we will investigate and resolve your concern within <strong className="text-white">48 business hours</strong> of receiving your complaint.
                </p>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                  <h3 className="text-lg font-semibold text-blue-300">Eligible Issues Include:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-blue-200">
                    <li>Payment debited from account but no registration confirmation received</li>
                    <li>Duplicate charges for the same registration</li>
                    <li>Technical error during checkout preventing registration completion</li>
                    <li>System assigned incorrect registration category or pricing</li>
                    <li>Payment gateway failure or timeout resulting in payment deduction without registration</li>
                    <li>Registration confirmation sent to wrong email address due to system error</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mt-4 space-y-2">
                  <h3 className="text-lg font-semibold text-white">How to Report Technical Issues:</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Email us at <span className="text-blue-400">join.eventhub@gmail.com</span> within <strong>24 hours</strong> of the issue occurrence</li>
                    <li>Include your transaction ID, payment screenshot, and registered email address</li>
                    <li>Provide detailed description of the technical problem encountered</li>
                    <li>Attach any error messages or screenshots if available</li>
                  </ol>
                </div>

                <p className="mt-4">
                  Our support team will investigate your complaint and respond within 48 business hours with resolution. If the issue is verified as a legitimate technical or payment error on our end, appropriate action will be taken including refund processing if applicable.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">4. Event Cancellation by Organizer</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  If an event is cancelled by the event organizer, registered participants will receive a <strong className="text-white">full refund</strong> of the registration amount including all applicable fees and taxes.
                </p>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Refund Process for Organizer-Cancelled Events:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Automatic email notification sent to all registered participants</li>
                    <li>Refund initiated within 3-5 business days of cancellation</li>
                    <li>Amount credited to original payment method</li>
                    <li>Complete refund including registration fees and payment gateway charges</li>
                    <li>No action required from participant's side</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Refund Timeline:</h3>
                  <div className="space-y-2">
                    <p><strong className="text-blue-400">Credit/Debit Cards:</strong> 5-7 business days</p>
                    <p><strong className="text-blue-400">Net Banking:</strong> 5-7 business days</p>
                    <p><strong className="text-blue-400">UPI:</strong> 3-5 business days</p>
                    <p><strong className="text-blue-400">Wallets:</strong> 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">5. Event Postponement or Rescheduling</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  If an event is postponed or rescheduled to a new date by the organizer:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your registration remains <strong className="text-white">valid for the rescheduled date</strong></li>
                  <li><strong className="text-red-400">No refunds will be issued</strong> for rescheduled events</li>
                  <li>Email notification will be sent with new event details</li>
                  <li>If you cannot attend the rescheduled event, registration is non-transferable and non-refundable</li>
                  <li>New date will be announced at least 7 days before the original event date (subject to circumstances)</li>
                </ul>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                  <p className="text-yellow-200">
                    <strong>Note:</strong> Some event organizers may offer refunds for rescheduled events at their sole discretion. This will be communicated separately if applicable. EventHub cannot guarantee such refunds and this depends entirely on the organizer's policy.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">6. What Cannot Be Refunded</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>Refunds are <strong className="text-white">NOT available</strong> under the following circumstances:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Change of mind or personal decision not to attend</li>
                  <li>Personal scheduling conflicts or prior commitments</li>
                  <li>Inability to attend due to work, travel, or family reasons</li>
                  <li>Incorrect registration details entered by user</li>
                  <li>Selection of wrong event, date, or registration category</li>
                  <li>Lost or misplaced digital access passes (can be re-downloaded)</li>
                  <li>Dissatisfaction with event content, speakers, or organization</li>
                  <li>Weather conditions (unless event is officially cancelled)</li>
                  <li>Transportation or accommodation issues</li>
                  <li>Personal medical emergencies or health issues</li>
                  <li>Visa rejection or travel restrictions (for international participants)</li>
                  <li>Force majeure events affecting personal attendance</li>
                </ul>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                  <p className="text-red-200">
                    <strong>Important:</strong> EventHub does not provide refunds for personal circumstances. We recommend purchasing appropriate travel/event insurance if you're concerned about your ability to attend.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 7 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">7. Registration Transfer Policy</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  While we do not offer cancellations or refunds, some events may allow registration transfers to another person:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Check if your event allows transfers (indicated on event page and confirmation email)</li>
                  <li>Transfer requests must be submitted at least <strong className="text-white">48 hours before</strong> the event</li>
                  <li>Contact our support team with transferee's complete details (name, email, phone)</li>
                  <li>Transfer processing fee of ₹100-500 may apply (varies by event)</li>
                  <li>Original purchaser remains responsible for payment and registration validity</li>
                  <li>Limited to <strong className="text-white">one transfer per registration</strong></li>
                </ul>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                  <p className="text-blue-200">
                    <strong>Note:</strong> Registration transfers are subject to event organizer approval and not all events permit transfers. This is determined by the individual event organizer and communicated during registration.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 8 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">8. Refund Processing & Timeline</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  When refunds are approved for eligible cases only (technical issues or event cancellation by organizer):
                </p>
                
                <div className="bg-white/5 rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2">Refund Initiation:</h3>
                    <p>Within 3-5 business days after approval</p>
                  </div>

                  <div className="border-t border-white/20 pt-4">
                    <h3 className="font-semibold text-white mb-3">Credit to Payment Method:</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-400">Credit/Debit Cards:</span>
                        <span>5-7 business days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400">Net Banking:</span>
                        <span>5-7 business days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400">UPI:</span>
                        <span>3-5 business days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400">Wallets:</span>
                        <span>24-48 hours</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-4">
                  Refund timelines may vary depending on your bank or payment provider. If you don't receive your refund within the specified timeframe, please contact your bank first, then reach out to our support team with your refund reference number.
                </p>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                  <p className="text-yellow-200">
                    <strong>Processing Fees:</strong> For refunds processed due to technical errors, the full amount including payment gateway charges will be refunded. However, bank processing fees (if any) charged by your bank are non-refundable.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 9 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">9. Chargeback Policy</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  Filing unauthorized chargebacks with your bank/card issuer is a violation of our Terms and Conditions and may result in:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Permanent ban from EventHub platform</li>
                  <li>Legal action to recover chargeback amounts and associated costs</li>
                  <li>Reporting to relevant authorities for fraudulent activity</li>
                  <li>Blacklisting from future event registrations across partner platforms</li>
                </ul>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                  <p className="text-red-200">
                    <strong>Important:</strong> Before initiating a chargeback, please contact our support team at join.eventhub@gmail.com. We are committed to resolving legitimate issues within 48 hours. Chargebacks should only be used for genuinely fraudulent transactions.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 10 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">10. Force Majeure Events</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  In case of force majeure events (including but not limited to natural disasters, pandemics, government restrictions, acts of God, war, terrorism, or other unforeseeable circumstances), the following policy applies:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Event organizers will determine whether to cancel, postpone, or conduct the event virtually</li>
                  <li>If event is cancelled: Full refund will be processed within 10-15 business days</li>
                  <li>If event is postponed: Registrations remain valid for the new date; no refunds issued</li>
                  <li>If event moves to virtual/online format: Registrations remain valid; no refunds for format change</li>
                  <li>EventHub and event organizers are not liable for any additional costs incurred by participants</li>
                </ul>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                  <p className="text-blue-200">
                    <strong>Recommendation:</strong> We strongly recommend purchasing event insurance or travel insurance if you're concerned about force majeure situations affecting your attendance.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 11 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">11. Contact Us for Refund Queries</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>For legitimate refund claims or technical issues, please contact us immediately:</p>
                
                <div className="bg-white/5 rounded-lg p-6 mt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Email Support</p>
                      <p className="text-blue-400">join.eventhub@gmail.com</p>
                      <p className="text-sm text-white/60 mt-1">Response within 48 business hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Phone Support</p>
                      <p className="text-sm text-white/60 mt-1">Mon-Fri: 9:00 AM - 6:00 PM IST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-white">Registered Office</p>
                      <p>123 Event Street, New York, NY 10001</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
                  <p className="text-blue-200">
                    <strong>When Contacting Support:</strong> Always include your Registration ID, Transaction Reference Number, registered email address, and detailed description of the issue for faster resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 12 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">12. Dispute Resolution</h2>
              <div className="text-white/80 leading-relaxed space-y-3">
                <p>
                  All disputes arising from this policy shall be governed by the laws of India. Any legal proceedings shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka, India.
                </p>
                <p>
                  Before initiating any legal proceedings, parties agree to attempt resolution through:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Direct communication with EventHub support team</li>
                  <li>Mediation through mutually agreed mediator (if required)</li>
                  <li>Arbitration in accordance with Indian Arbitration and Conciliation Act, 1996</li>
                </ol>
              </div>
            </div>

            {/* Section 13 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">13. Policy Updates</h2>
              <p className="text-white/80 leading-relaxed">
                EventHub reserves the right to modify this Cancellation and Refund Policy at any time. Changes will be effective immediately upon posting on our website with an updated "Last Updated" date. Your continued use of our platform after changes indicates acceptance of the updated policy. We encourage you to review this policy periodically.
              </p>
            </div>

            {/* Final Important Note */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Before You Register - Important Checklist:</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-white/90">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Verify event date, time, and venue</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Confirm registration category and pricing</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Check your availability to attend</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Review organizer's terms and conditions</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Save confirmation email immediately</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Download digital access pass</span>
                </div>
              </div>
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
              <Link href="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
