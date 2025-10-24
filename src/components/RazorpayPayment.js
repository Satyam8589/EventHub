"use client";
import { useEffect } from "react";

const RazorpayPayment = ({
  orderData,
  userDetails,
  onSuccess,
  onFailure,
  onClose,
}) => {
  useEffect(() => {
    // Load Razorpay script
    const loadRazorpay = async () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        initializePayment();
      };

      script.onerror = () => {
        console.error("Failed to load Razorpay SDK");
        onFailure("Failed to load payment gateway");
      };

      document.head.appendChild(script);
    };

    const initializePayment = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EventHub",
        description: `Ticket for ${orderData.event.title}`,
        image: "/favicon.ico", // You can add your logo here
        order_id: orderData.orderId,
        handler: async function (response) {
          console.log("Payment Success Response:", response);

          try {
            // Verify payment on server
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: orderData.bookingId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              console.log("Payment verified successfully!");
              onSuccess(verifyData);
            } else {
              console.error("Payment verification failed:", verifyData.error);
              onFailure(verifyData.error || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            onFailure("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: userDetails.fullName,
          email: userDetails.email,
          contact: userDetails.phoneNumber,
        },
        notes: {
          event_id: orderData.event.id,
          event_title: orderData.event.title,
        },
        theme: {
          color: "#3b82f6", // Blue color matching your theme
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal dismissed");
            onClose();
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("Payment Failed:", response.error);
        onFailure(
          response.error.description ||
            response.error.reason ||
            "Payment failed. Please try again."
        );
      });

      // Open Razorpay payment modal
      razorpay.open();
    };

    if (orderData) {
      loadRazorpay();
    }

    // Cleanup function
    return () => {
      const script = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, [orderData, userDetails, onSuccess, onFailure, onClose]);

  // This component doesn't render anything visible
  // Razorpay modal will handle the UI
  return null;
};

export default RazorpayPayment;
