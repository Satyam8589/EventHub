"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation"; 

export default function PrivacyPolicyPage() {
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
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l-4-4m0 0l4-4m-4 4h14" />
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
              Privacy Policy
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
            
            {/* Introduction */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Introduction</h2>
              <p className="text-white/80 leading-relaxed">
                EventHub ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our online ticket booking platform. Please read this policy carefully to understand our practices.
              </p>
            </div>

            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">1. Information We Collect</h2>
              <div className="text-white/80 leading-relaxed space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">1.1 Personal Information</h3>
                  <p className="mb-2">When you create an account or book tickets, we collect:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Date of birth</li>
                    <li>Billing address</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">1.2 Payment Information</h3>
                  <p>
                    Payment processing is handled by Razorpay. We do not store your complete credit/debit card information. We may store the last 4 digits and card type for reference purposes only.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">1.3 Technical Information</h3>
                  <p className="mb-2">We automatically collect:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>IP address</li>
                    <li>Browser type and version</li>
                    <li>Device information</li>
                    <li>Operating system</li>
                    <li>Pages visited and time spent</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">1.4 Communication Data</h3>
                  <p>
                    We collect information from your communications with us, including customer support inquiries, feedback, and survey responses.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">2. How We Use Your Information</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>We use the collected information for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Processing ticket bookings and payments</li>
                  <li>Sending booking confirmations and digital tickets</li>
                  <li>Providing customer support</li>
                  <li>Sending event updates and reminders</li>
                  <li>Improving our platform and user experience</li>
                  <li>Preventing fraud and ensuring platform security</li>
                  <li>Complying with legal obligations</li>
                  <li>Sending promotional emails (with your consent)</li>
                  <li>Analyzing usage patterns and trends</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">3. Information Sharing and Disclosure</h2>
              <div className="text-white/80 leading-relaxed space-y-4">
                <p>We may share your information with:</p>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.1 Event Organizers</h3>
                  <p>We share necessary attendee information (name, email, phone) with event organizers for event management purposes.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.2 Payment Processors</h3>
                  <p>Razorpay processes all payments. Please review their privacy policy at razorpay.com for information on how they handle your data.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.3 Service Providers</h3>
                  <p>Third-party service providers who help us operate our platform, including email service providers, hosting services, and analytics providers.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">3.4 Legal Requirements</h3>
                  <p>We may disclose information when required by law, court order, or to protect our rights and safety.</p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300"><strong>Note:</strong> We never sell your personal information to third parties for marketing purposes.</p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">4. Data Security</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>We implement industry-standard security measures to protect your information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>SSL/TLS encryption for data transmission</li>
                  <li>Encrypted storage of sensitive information</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication protocols</li>
                  <li>Secure payment processing through PCI-DSS compliant providers</li>
                </ul>
                <p className="mt-4">
                  However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">5. Cookies and Tracking Technologies</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze site traffic and usage patterns</li>
                  <li>Personalize content and advertisements</li>
                  <li>Maintain your login session</li>
                </ul>
                <p className="mt-4">
                  You can control cookie preferences through your browser settings. Note that disabling cookies may affect platform functionality.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">6. Your Privacy Rights</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Access:</strong> Request copies of your personal information</li>
                  <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong className="text-white">Deletion:</strong> Request deletion of your personal data (subject to legal obligations)</li>
                  <li><strong className="text-white">Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong className="text-white">Data Portability:</strong> Receive your data in a structured format</li>
                  <li><strong className="text-white">Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at join.eventhub@gmail.com
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">7. Data Retention</h2>
              <p className="text-white/80 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Account information is kept while your account is active and for up to 7 years after account closure for legal and accounting purposes. Booking records are retained for 10 years to comply with tax and financial regulations.
              </p>
            </div>

            {/* Section 8 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">8. Children's Privacy</h2>
              <p className="text-white/80 leading-relaxed">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we discover we have collected information from a child, we will delete it immediately.
              </p>
            </div>

            {/* Section 9 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">9. Third-Party Links</h2>
              <p className="text-white/80 leading-relaxed">
                Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
              </p>
            </div>

            {/* Section 10 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">10. International Data Transfers</h2>
              <p className="text-white/80 leading-relaxed">
                Your information may be transferred to and processed in countries other than India. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </div>

            {/* Section 11 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">11. Changes to This Privacy Policy</h2>
              <p className="text-white/80 leading-relaxed">
                We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy regularly. Continued use of our platform after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* Section 12 */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">12. Contact Us</h2>
              <div className="text-white/80 leading-relaxed space-y-2">
                <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
                <div className="bg-white/5 rounded-lg p-4 mt-4 space-y-2">
                  <p><strong className="text-white">Email:</strong> join.eventhub@gmail.com</p>
                  <p><strong className="text-white">Phone:</strong> +91 9263472616</p>
                  <p><strong className="text-white">Address:</strong> Anandapur, Kolkata, West Bengal</p>
                  <p><strong className="text-white">Business Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM IST</p>
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
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}