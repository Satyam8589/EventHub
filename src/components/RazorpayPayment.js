"use client";
import { useEffect, useRef } from "react";

const RazorpayPayment = ({
  orderData,
  userDetails,
  onSuccess,
  onFailure,
  onClose,
}) => {
  const razorpayInstanceRef = useRef(null);

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

          // Close Razorpay modal IMMEDIATELY
          if (razorpayInstanceRef.current) {
            console.log("Closing Razorpay modal immediately...");
            try {
              razorpayInstanceRef.current.close();
            } catch (closeError) {
              console.error("Error closing Razorpay modal:", closeError);
            }
          }

          // Show success popup IMMEDIATELY before verification
          console.log("Showing success popup immediately...");
          onSuccess({
            success: true,
            message: "Payment successful! Verifying...",
            immediate: true, // Flag to indicate this is immediate feedback
          });

          // Verify payment in background
          try {
            console.log("Verifying payment in background...");
            console.log("Sending verification request with:", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              bookingId: orderData.bookingId,
            });

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

            console.log("Verify response status:", verifyResponse.status);
            console.log("Verify response ok:", verifyResponse.ok);

            // Check if response has content before trying to parse JSON
            const responseText = await verifyResponse.text();
            console.log("Verify response text:", responseText);

            let verifyData;
            try {
              verifyData = JSON.parse(responseText);
              console.log("Verify response data (parsed):", verifyData);
            } catch (parseError) {
              console.error("Failed to parse response as JSON:", parseError);
              console.error("Raw response was:", responseText);
              throw new Error(
                "Server returned invalid response. Please check server logs."
              );
            }

            if (verifyData.success) {
              console.log("Payment verified successfully in background!");
              // Verification succeeded - user already sees success popup
            } else {
              console.error(
                "Background verification failed:",
                verifyData.error
              );
              console.error("Full error details:", verifyData);
              // Show error after a moment if verification fails
              setTimeout(() => {
                onFailure(verifyData.error || "Payment verification failed");
              }, 500);
            }
          } catch (error) {
            console.error("Background payment verification error:", error);
            // Show error after a moment if verification fails
            setTimeout(() => {
              onFailure("Payment verification failed. Please contact support.");
            }, 500);
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

      const razorpayInstance = new window.Razorpay(options);

      // Store instance in ref for later use
      razorpayInstanceRef.current = razorpayInstance;

      razorpayInstance.on("payment.failed", function (response) {
        console.error("Payment Failed:", response.error);
        onFailure(
          response.error.description ||
            response.error.reason ||
            "Payment failed. Please try again."
        );
      });

      // Open Razorpay payment modal
      razorpayInstance.open();
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
