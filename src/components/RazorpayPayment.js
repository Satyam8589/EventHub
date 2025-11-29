"use client";
import { useEffect, useRef } from "react";

// Helper function to poll payment status
const pollPaymentStatus = async (bookingId, maxAttempts = 15, intervalMs = 2000) => {
  console.log(`🔍 Starting payment status polling for booking: ${bookingId}`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`📊 Polling attempt ${i + 1}/${maxAttempts}`);
      
      const response = await fetch(`/api/payment/status/${bookingId}`);
      const data = await response.json();
      
      if (data.success && data.booking) {
        const status = data.booking.status;
        console.log(`📋 Booking status: ${status}`);
        
        if (status === "CONFIRMED") {
          console.log("✅ Payment confirmed!");
          return { success: true, booking: data.booking };
        } else if (status === "FAILED") {
          console.log("❌ Payment failed");
          return { 
            success: false, 
            error: data.booking.failureReason || "Payment failed" 
          };
        }
        // Status is still PENDING, continue polling
      }
      
      // Wait before next attempt (except on last attempt)
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    } catch (error) {
      console.error(`❌ Polling attempt ${i + 1} error:`, error);
      // Continue polling even if one attempt fails
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
  }
  
  console.log("⏱️ Polling timeout - payment status still pending");
  return { 
    success: false, 
    error: "Payment verification timeout. Please check My Events page." 
  };
};

const RazorpayPayment = ({
  orderData,
  userDetails,
  onSuccess,
  onFailure,
  onClose,
}) => {
  const razorpayInstanceRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isDismissedRef = useRef(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log("⚠️ Razorpay already initialized, skipping");
      return;
    }
    isInitializedRef.current = true;

    // Load Razorpay script
    const loadRazorpay = async () => {
      // Check if script already exists
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        console.log("Razorpay script already loaded");
        if (window.Razorpay) {
          initializePayment();
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        initializePayment();
      };

      script.onerror = () => {
        console.error("Failed to load Razorpay SDK");
        isInitializedRef.current = false;
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
        image: "/eventhub-logo.svg",
        order_id: orderData.orderId,
        handler: async function (response) {
          console.log("Payment Success Response:", response);

          // Prevent duplicate processing
          if (isProcessingRef.current) {
            console.log("⚠️ Already processing payment, skipping duplicate call");
            return;
          }
          isProcessingRef.current = true;

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

          // Verify payment with retry mechanism
          const maxRetries = 3;
          let attempt = 0;
          let verified = false;

          while (attempt < maxRetries && !verified) {
            attempt++;
            console.log(`🔄 Verification attempt ${attempt}/${maxRetries}`);

            try {
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
                  retryAttempt: attempt > 1 ? attempt : undefined,
                }),
              });

              console.log("Verify response status:", verifyResponse.status);

              const responseText = await verifyResponse.text();
              let verifyData;

              try {
                verifyData = JSON.parse(responseText);
                console.log("Verify response data:", verifyData);
              } catch (parseError) {
                console.error("Failed to parse response:", parseError);
                throw new Error("Invalid server response");
              }

              if (verifyData.success) {
                console.log("✅ Payment verified successfully!");
                verified = true;
                // Verification succeeded - user already sees success popup
                break;
              } else {
                console.error(`❌ Verification attempt ${attempt} failed:`, verifyData.error);
                
                // If this was the last attempt, try status polling as fallback
                if (attempt === maxRetries) {
                  console.log("🔍 Starting status polling fallback...");
                  const pollingResult = await pollPaymentStatus(orderData.bookingId);
                  
                  if (pollingResult.success) {
                    console.log("✅ Payment confirmed via status polling!");
                    verified = true;
                  } else {
                    throw new Error(verifyData.error || "Payment verification failed");
                  }
                } else {
                  // Wait before retry with exponential backoff
                  const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                  console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
                  await new Promise(resolve => setTimeout(resolve, backoffMs));
                }
              }
            } catch (error) {
              console.error(`❌ Verification attempt ${attempt} error:`, error);
              
              if (attempt === maxRetries) {
                // Last attempt failed, try status polling
                console.log("🔍 Starting status polling fallback...");
                try {
                  const pollingResult = await pollPaymentStatus(orderData.bookingId);
                  
                  if (pollingResult.success) {
                    console.log("✅ Payment confirmed via status polling!");
                    verified = true;
                  } else {
                    throw error;
                  }
                } catch (pollError) {
                  console.error("❌ Status polling also failed:", pollError);
                  setTimeout(() => {
                    onFailure("Payment verification failed. Please check 'My Events' or contact support.");
                  }, 500);
                  return;
                }
              } else {
                // Wait before retry
                const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
              }
            }
          }

          if (!verified) {
            setTimeout(() => {
              onFailure("Payment verification failed after multiple attempts. Please check 'My Events' or contact support.");
            }, 500);
          }
        },
        prefill: {
          name: userDetails.fullName,
          email: userDetails.email,
          contact: userDetails.phoneNumber,
        },
        // Prevent user from editing prefilled name and email in Razorpay modal
        readonly: {
          name: true,
          email: true,
        },
        notes: {
          event_id: orderData.event.id,
          event_title: orderData.event.title,
        },
        theme: {
          color: "#3b82f6", // Blue color matching your theme
        },
        modal: {
          ondismiss: async function () {
            console.log("Payment modal dismissed");
            
            // Prevent multiple dismiss calls
            if (isDismissedRef.current || isProcessingRef.current) {
              console.log("⚠️ Already dismissed or processing, skipping");
              return;
            }
            isDismissedRef.current = true;
            
            // Check if payment might have been completed
            // Poll the booking status to see if payment succeeded
            console.log("🔍 Checking if payment was completed before dismissal...");
            
            try {
              // Wait a moment for any in-flight verification to complete
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Check booking status
              const statusResponse = await fetch(`/api/payment/status/${orderData.bookingId}`);
              const statusData = await statusResponse.json();
              
              if (statusData.success && statusData.booking) {
                const status = statusData.booking.status;
                console.log(`📋 Booking status after dismissal: ${status}`);
                
                if (status === "CONFIRMED") {
                  // Payment was completed! Show success
                  console.log("✅ Payment was completed before dismissal!");
                  onSuccess({
                    success: true,
                    message: "Payment successful! Your tickets are confirmed.",
                  });
                  return;
                } else if (status === "PENDING") {
                  // Payment might still be processing - just close without polling
                  console.log("ℹ️ Payment still pending after dismissal");
                  onClose();
                  return;
                }
              }
            } catch (error) {
              console.error("Error checking payment status on dismiss:", error);
            }
            
            // If we get here, payment wasn't completed
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

    // Cleanup function - close Razorpay instance but don't remove script
    return () => {
      if (razorpayInstanceRef.current) {
        try {
          razorpayInstanceRef.current.close();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // This component doesn't render anything visible
  // Razorpay modal will handle the UI
  return null;
};

export default RazorpayPayment;
