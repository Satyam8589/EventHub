"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RazorpayPayment from "./RazorpayPayment";

export default function BookingModal({ event, isOpen, onClose }) {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: user?.displayName || user?.email?.split("@")[0] || "",
    email: user?.email || "",
    phoneNumber: "",
    numberOfTickets: 1,
    specialRequests: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState("form"); // "form", "payment", "success", "failed"
  const [orderData, setOrderData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotal = () => {
    return (event?.price || 0) * formData.numberOfTickets;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // Create Razorpay order
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          eventId: event.id,
          tickets: parseInt(formData.numberOfTickets),
          totalAmount: calculateTotal(),
          userDetails: {
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("Payment order created:", data);
        setOrderData(data);
        setPaymentStep("payment");
      } else {
        throw new Error(data.error || "Failed to create payment order");
      }
    } catch (error) {
      console.error("Order creation error:", error);
      setErrorMessage(
        error.message || "Failed to proceed to payment. Please try again."
      );
      setPaymentStep("failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log("Payment successful:", paymentData);
    setPaymentStep("success");

    // Redirect to My Events page after 3 seconds
    setTimeout(() => {
      resetModal();
      onClose();
      router.push('/my-events');
    }, 3000);
  };

  const handlePaymentFailure = (error) => {
    console.error("Payment failed:", error);
    setErrorMessage(error || "Payment failed. Please try again.");
    setPaymentStep("failed");
  };

  const handlePaymentClose = () => {
    setPaymentStep("form");
    setOrderData(null);
  };

  const resetModal = () => {
    setPaymentStep("form");
    setOrderData(null);
    setSuccess(false);
    setErrorMessage("");
    setFormData({
      fullName: user?.displayName || user?.email?.split("@")[0] || "",
      email: user?.email || "",
      phoneNumber: "",
      numberOfTickets: 1,
      specialRequests: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-lg mx-auto border border-white/20 relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-80"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors z-20 bg-white/50 hover:bg-white/80 rounded-full p-1"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="relative z-10 p-6">
          {paymentStep === "success" ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                🎉 Payment Successful!
              </h3>
              <p className="text-gray-700 mb-2">
                Your tickets have been confirmed successfully.
              </p>
              <p className="text-sm text-gray-600">
                📧 Ticket details have been sent to your email.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Redirecting you back...
              </p>
            </div>
          ) : paymentStep === "failed" ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">
                ❌ Payment Failed
              </h3>
              <p className="text-gray-700 mb-4">
                {errorMessage || "Something went wrong with your payment."}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setPaymentStep("form");
                    setErrorMessage("");
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Book Your Spot
                </h2>
                <p className="text-gray-600">
                  Complete the form below to reserve your tickets for{" "}
                  <span className="font-medium text-gray-800">
                    {event?.title}
                  </span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-100/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-500 text-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-100/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-500 text-sm"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-100/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-500 text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Number of Tickets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Tickets
                  </label>
                  <select
                    name="numberOfTickets"
                    value={formData.numberOfTickets}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-100/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Total Amount */}
                <div className="bg-gray-100/60 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 text-sm">
                      Total Amount:
                    </span>
                    <span className="text-xl font-bold text-gray-800">
                      ₹{calculateTotal().toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-100/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-500 resize-none text-sm"
                    placeholder="Any special requirements or requests..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Razorpay Payment Component */}
      {paymentStep === "payment" && orderData && (
        <RazorpayPayment
          orderData={orderData}
          userDetails={formData}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
}
