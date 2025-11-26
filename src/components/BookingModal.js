"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import RazorpayPayment from "./RazorpayPayment";

export default function BookingModal({
  event,
  isOpen,
  onClose,
  onBookingSuccess,
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    numberOfTickets: 1,
    specialRequests: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState("form");
  const [orderData, setOrderData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [userTotalTickets, setUserTotalTickets] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState("");
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  // Fetch user details from backend when modal opens
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!isOpen || !user?.uid) return;

      setLoadingUserData(true);
      try {
        const response = await fetch(`/api/user/${user.uid}`);
        if (response.ok) {
          const json = await response.json();
          const u = json.user || {};
          setFormData((prev) => ({
            ...prev,
            fullName:
              u.name || user?.displayName || user?.email?.split("@")[0] || "",
            email: u.email || user?.email || "",
            phoneNumber:
              u.phone || prev.phoneNumber || user?.dbUser?.phone || "",
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            fullName:
              user?.dbUser?.name ||
              user?.displayName ||
              user?.email?.split("@")[0] ||
              "",
            email: user?.dbUser?.email || user?.email || "",
            phoneNumber: user?.dbUser?.phone || prev.phoneNumber || "",
          }));
        }
      } catch (error) {
        setFormData((prev) => ({
          ...prev,
          fullName:
            user?.dbUser?.name ||
            user?.displayName ||
            user?.email?.split("@")[0] ||
            "",
          email: user?.dbUser?.email || user?.email || "",
          phoneNumber: user?.dbUser?.phone || prev.phoneNumber || "",
        }));
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserDetails();
  }, [isOpen, user]);

  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!isOpen || !user?.uid || !event?.id) return;
      setLoadingBookings(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("tickets,status")
        .eq("eventId", event.id)
        .eq("userId", user.uid)
        .eq("status", "CONFIRMED");
      if (!error && Array.isArray(data)) {
        const totalTickets = data.reduce((sum, b) => sum + (b.tickets || 0), 0);
        setUserTotalTickets(totalTickets);
        const maxPerUser =
          event?.max_tickets_per_user && event.max_tickets_per_user > 0
            ? event.max_tickets_per_user
            : null;
        const remaining = maxPerUser
          ? Math.max(maxPerUser - totalTickets, 0)
          : null;
        if (
          remaining !== null &&
          formData.numberOfTickets > Math.max(1, remaining)
        ) {
          setFormData((prev) => ({
            ...prev,
            numberOfTickets: Math.max(1, remaining),
          }));
        }
      }
      setLoadingBookings(false);
    };
    fetchUserBookings();
  }, [isOpen, user?.uid, event?.id]);

  // Check if event is sold out
  const registered = event?.registered || event?._count?.bookings || 0;
  const capacity = event?.capacity || 0;
  const spotsLeft = Math.max(capacity - registered, 0);
  const isSoldOut = capacity > 0 && spotsLeft === 0;
  const hasBookingLimit =
    event?.max_tickets_per_user && event.max_tickets_per_user > 0;
  const userReachedLimit =
    hasBookingLimit && userTotalTickets >= event.max_tickets_per_user;
  const remainingUserLimit = hasBookingLimit
    ? Math.max(event.max_tickets_per_user - userTotalTickets, 0)
    : null;
  const ticketOptionMax = Math.max(
    1,
    Math.min(
      remainingUserLimit ?? 10,
      capacity > 0 ? spotsLeft : remainingUserLimit ?? 10
    )
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate discount amount
  const getDiscountAmount = () => {
    if (!appliedDiscount) return 0;

    const baseTotal = (event?.price || 0) * formData.numberOfTickets;

    if (appliedDiscount.type === "PERCENTAGE") {
      return (baseTotal * appliedDiscount.value) / 100;
    } else if (appliedDiscount.type === "FIXED") {
      return appliedDiscount.value;
    }

    return 0;
  };

  const calculateTotal = () => {
    const baseTotal = (event?.price || 0) * formData.numberOfTickets;
    const discountAmount = getDiscountAmount();
    return Math.max(0, baseTotal - discountAmount);
  };

  // Handle applying discount code
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }

    setValidatingDiscount(true);
    setDiscountError("");

    try {
      const response = await fetch(
        `/api/events/${event.id}/validate-discount`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: discountCode.trim() }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setAppliedDiscount(data.discount);
        setDiscountError("");
      } else {
        setDiscountError(data.error || "Invalid discount code");
        setAppliedDiscount(null);
      }
    } catch (error) {
      setDiscountError("Failed to validate discount code");
      setAppliedDiscount(null);
    } finally {
      setValidatingDiscount(false);
    }
  };

  // Handle removing discount
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSoldOut) {
      setErrorMessage("This event is sold out. No more tickets are available.");
      return;
    }

    if (capacity > 0 && registered + formData.numberOfTickets > capacity) {
      const availableTickets = Math.max(capacity - registered, 0);
      if (availableTickets === 0) {
        setErrorMessage(
          "This event is sold out. No more tickets are available."
        );
      } else {
        setErrorMessage(
          `Only ${availableTickets} ticket${
            availableTickets === 1 ? "" : "s"
          } available. Please reduce your ticket quantity.`
        );
      }
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phoneNumber) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (
      hasBookingLimit &&
      remainingUserLimit !== null &&
      formData.numberOfTickets > remainingUserLimit
    ) {
      setErrorMessage(
        `You can book up to ${remainingUserLimit} ticket${
          remainingUserLimit === 1 ? "" : "s"
        } for this event.`
      );
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          eventId: event.id,
          tickets: parseInt(formData.numberOfTickets),
          totalAmount: (event?.price || 0) * parseInt(formData.numberOfTickets),
          finalAmount: calculateTotal(),
          discountCode: discountCode || null,
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
        if (data.free) {
          setPaymentStep("success");
          if (onBookingSuccess) onBookingSuccess();
          setTimeout(() => {
            resetModal();
            onClose();
            router.push("/my-events");
          }, 2000);
        } else {
          setOrderData(data);
          setPaymentStep("payment");
        }
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
    console.log("=== PAYMENT SUCCESS IN BOOKING MODAL ===");
    console.log("Payment successful:", paymentData);
    setPaymentStep("success");

    // 🔥 CALL THE CALLBACK TO REFRESH PARENT DATA INSTANTLY
    if (onBookingSuccess) {
      console.log(
        "✅ Triggering onBookingSuccess callback to refresh availability"
      );
      onBookingSuccess();
    }

    setTimeout(() => {
      resetModal();
      onClose();
      router.push("/my-events");
    }, 3000);
  };

  const handlePaymentFailure = (error) => {
    console.error("=== PAYMENT FAILURE IN BOOKING MODAL ===");
    console.error("Payment failed (raw):", error);

    let message = "Payment failed. Please try again.";

    try {
      if (!error) {
        message = "Payment failed. Please try again.";
      } else if (typeof error === "string") {
        message = error;
      } else if (typeof error === "object") {
        if (error.error) message = error.error;
        else if (error.message) message = error.message;
        else if (error.details) message = error.details;
        else message = JSON.stringify(error);
      }
    } catch (e) {
      console.error("Error parsing failure object:", e);
    }

    setErrorMessage(message);
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
    setDiscountCode("");
    setAppliedDiscount(null);
    setDiscountError("");
    setFormData({
      fullName: "",
      email: "",
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-80"></div>

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
                🎉 Booking Complete!
              </h3>
              <p className="text-gray-700 mb-2">
                Your payment has been verified and your tickets are confirmed.
              </p>
              <p className="text-sm text-gray-600 mb-1">
                📧 Ticket details have been sent to your email.
              </p>
              <p className="text-sm text-blue-600 font-medium mt-4">
                Redirecting to My Events page...
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
                ❌ Booking Not Completed
              </h3>
              <p className="text-gray-700 mb-4">
                {errorMessage ||
                  "Your payment could not be processed. Please try again."}
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
                {isSoldOut && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <span className="text-red-800 font-semibold">
                        Event Sold Out
                      </span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      All tickets for this event have been booked. Capacity may
                      be upgraded later.
                    </p>
                  </div>
                )}
                {!isSoldOut && capacity > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">{spotsLeft}</span> spot
                    {spotsLeft === 1 ? "" : "s"} remaining out of {capacity}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      readOnly
                      aria-readonly="true"
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-gray-100/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-500 text-sm cursor-not-allowed"
                      placeholder="Loading..."
                    />
                    {loadingUserData && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      readOnly
                      aria-readonly="true"
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-gray-100/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-500 text-sm cursor-not-allowed"
                      placeholder="Loading..."
                    />
                    {loadingUserData && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
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
                    disabled={userReachedLimit || isSoldOut || loadingBookings}
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-100/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm"
                  >
                    {Array.from(
                      { length: ticketOptionMax },
                      (_, i) => i + 1
                    ).map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Discount Code */}
                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Code (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) =>
                        setDiscountCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter discount code"
                      disabled={validatingDiscount || !!appliedDiscount}
                      className="flex-1 px-3 py-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {!appliedDiscount ? (
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={validatingDiscount || !discountCode.trim()}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {validatingDiscount ? "Validating..." : "Apply"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="px-4 py-2.5 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors whitespace-nowrap"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Success Message */}
                  {appliedDiscount && (
                    <div className="mt-2 text-sm text-green-700 font-medium flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        {appliedDiscount.code} applied -{" "}
                        {appliedDiscount.type === "PERCENTAGE"
                          ? `${appliedDiscount.value}% off`
                          : `₹${appliedDiscount.value} off`}
                      </span>
                    </div>
                  )}

                  {/* Error Message */}
                  {discountError && (
                    <p className="mt-2 text-sm text-red-600">{discountError}</p>
                  )}
                </div>

                {/* Total Amount */}
                <div className="bg-gray-100/60 rounded-lg p-3 border border-gray-200">
                  {appliedDiscount && (
                    <>
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                        <span>Original Price:</span>
                        <span className="line-through">
                          ₹
                          {(
                            (event?.price || 0) * formData.numberOfTickets
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-green-600 mb-2">
                        <span>Discount:</span>
                        <span>
                          -₹{getDiscountAmount().toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 my-2"></div>
                    </>
                  )}
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
                  disabled={loading || isSoldOut}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform shadow-lg text-sm ${
                    isSoldOut
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  }`}
                >
                  {isSoldOut ? (
                    "Event Sold Out"
                  ) : loadingUserData ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Loading Details...
                    </div>
                  ) : loading ? (
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
