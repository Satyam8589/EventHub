import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { sendNotificationToUser } from "@/lib/notificationHelper";
import { sendTicketToUser } from "@/lib/ticketEmail";

// ⚡ Route segment config for Vercel deployment
export const runtime = 'nodejs'; // Use Node.js runtime (not Edge)
export const maxDuration = 60; // Maximum execution time in seconds (Pro plan)
// For free plan, use: export const maxDuration = 10;

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper function to get current IST timestamp
const getIstTimestamp = () => {
  const now = new Date();
  const datePart = new Intl.DateTimeFormat("en-CA", { 
    timeZone: "Asia/Kolkata", 
    year: "numeric", 
    month: "2-digit", 
    day: "2-digit" 
  }).format(now);
  const timePart = new Intl.DateTimeFormat("en-GB", { 
    timeZone: "Asia/Kolkata", 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit", 
    hour12: false 
  }).format(now);
  return `${datePart}T${timePart}+05:30`;
};

// POST /api/payment/verify - Verify Razorpay payment
export async function POST(request) {
  const startTime = Date.now();
  let body = null;

  try {
    console.log("🚀 Payment verification started at:", new Date().toISOString());
    console.log("🌍 Environment:", process.env.NODE_ENV);
    console.log("⚡ Runtime:", process.env.VERCEL_REGION || 'local');

    body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = body;
    
    console.log(
      "Full request body:",
      JSON.stringify(
        {
          razorpay_order_id,
          razorpay_payment_id,
          bookingId,
          signatureLength: razorpay_signature?.length,
        },
        null,
        2
      )
    );

    // Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !bookingId
    ) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    
    if (generatedSignature !== razorpay_signature) {
      const nowIstIso = getIstTimestamp();
      
      await supabase
        .from("bookings")
        .update({
          status: "FAILED",
          failureReason: "Payment signature verification failed",
          updatedAt: nowIstIso,
        })
        .eq("id", bookingId);

      try {
        const { data: bookingForPush } = await supabase
          .from("bookings")
          .select("id,userId,eventId")
          .eq("id", bookingId)
          .single();
        if (bookingForPush) {
          const { data: eventInfo } = await supabase
            .from("events")
            .select("id,title")
            .eq("id", bookingForPush.eventId)
            .single();
          await sendNotificationToUser(bookingForPush.userId, "payment-failed", {
            eventTitle: eventInfo?.title || "the event",
            eventId: bookingForPush.eventId,
          });
        }
      } catch (_) {}

      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed - Invalid signature",
        },
        { status: 400 }
      );
    }

    // Get the pending booking
    let { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    console.log("=== BOOKING QUERY RESULT (by ID) ===");

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if booking is already confirmed
    if (booking.status === "CONFIRMED") {
      return NextResponse.json(
        {
          success: false,
          error: "This payment has already been verified",
        },
        { status: 400 }
      );
    }

    // Check if booking status is PENDING and paymentId matches
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Booking is not in pending state" },
        { status: 400 }
      );
    }

    // Verify that the order ID matches
    const expectedPaymentId = `PENDING_${razorpay_order_id}`;
    if (booking.paymentId !== expectedPaymentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment ID mismatch - possible fraud attempt",
        },
        { status: 400 }
      );
    }

    // 🔒 ATOMIC BOOKING CONFIRMATION WITH AVAILABILITY CHECK
    const { data: confirmationResult, error: rpcError } = await supabase.rpc(
      "confirm_booking_with_availability_check",
      {
        p_booking_id: bookingId,
        p_payment_id: razorpay_payment_id,
      }
    );

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error(
        `Database function error: ${rpcError.message}. Please ensure the database migration has been applied.`
      );
    }

    const result = confirmationResult;

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Booking confirmation failed",
          details: result,
        },
        { status: 400 }
      );
    }

    // Extract booking and event from result
    const confirmedBooking = result.booking;
    const eventInfo = result.event;
    const storedPaymentId = confirmedBooking.paymentId || razorpay_payment_id;

    // Prepare success response
    const successResponse = {
      success: true,
      message:
        "Payment verified successfully! Your tickets have been confirmed.",
      booking: {
        id: confirmedBooking.id,
        status: confirmedBooking.status,
        tickets: confirmedBooking.tickets,
        totalAmount: confirmedBooking.totalAmount,
        paymentId: storedPaymentId,
        event: {
          id: eventInfo.id,
          title: eventInfo.title,
          date: eventInfo.date,
          time: eventInfo.time,
          location: eventInfo.location,
        },
      },
    };

    // Persist verification metadata on booking
    try {
      const nowIstIso = getIstTimestamp();
      let { error: metaError } = await supabase
        .from("bookings")
        .update({
          paymentVerifiedAt: nowIstIso,
          ticketgeneratedat: nowIstIso,
          razorpaysignature: razorpay_signature,
          updatedAt: nowIstIso,
        })
        .eq("id", bookingId);
      
      if (metaError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = require("@supabase/supabase-js");
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { error: metaError2 } = await admin
          .from("bookings")
          .update({
            paymentVerifiedAt: nowIstIso,
            ticketgeneratedat: nowIstIso,
            razorpaysignature: razorpay_signature,
            updatedAt: nowIstIso,
          })
          .eq("id", bookingId);
        if (metaError2) {
          console.error("Metadata update error with admin client:", metaError2);
        }
      }
    } catch (_) {}

    // ✅ INCREMENT DISCOUNT USAGE AFTER SUCCESSFUL PAYMENT
    if (confirmedBooking.discountId) {
      try {
        const { error: discountError } = await supabase.rpc(
          "increment_discount_usage",
          { 
            discount_id: confirmedBooking.discountId 
          }
        );
        if (discountError) {
          console.error("❌ Error incrementing discount usage:", discountError);
        } else {
          console.log("✅ Discount usage incremented for:", confirmedBooking.discountId);
        }
      } catch (discountError) {
        console.error("❌ Exception incrementing discount usage:", discountError);
        // Don't fail payment if discount increment fails
      }
    }

    // Send success notification
    try {
      await sendNotificationToUser(confirmedBooking.userId, "payment-success", {
        eventTitle: eventInfo?.title || "the event",
        eventId: eventInfo?.id,
      });
    } catch (_) {}

    // 📧 SEND TICKET EMAIL WITH QR CODE (in background with 15-second delay)
    // Wait 15 seconds before sending ticket email to give user time to see payment success
    const ticketPromise = new Promise((resolve) => setTimeout(resolve, 15000))
      .then(() => {
        console.log("⏰ 15 seconds elapsed, sending ticket email now...");
        return sendTicketToUser(confirmedBooking.id, eventInfo);
      })
      .then((ticketResult) => {
        if (ticketResult.success) {
          console.log("✅ Ticket email sent for booking:", confirmedBooking.id);
          
          // 🔔 Send push notification to user about ticket email
          return sendNotificationToUser(confirmedBooking.userId, "ticket-sent", {
            eventTitle: eventInfo?.title || "the event",
            eventId: eventInfo?.id,
          })
            .then(() => console.log("✅ Ticket sent notification delivered to user"))
            .catch((notifError) => console.error("❌ Error sending ticket notification:", notifError));
        } else {
          console.error("❌ Ticket email failed:", ticketResult.error);
        }
      })
      .catch((emailError) => {
        console.error("❌ Error sending ticket email:", emailError);
      });

    // Don't await - let it run in background
    // The serverless function will keep running even after response is sent
    ticketPromise.catch(() => {}); // Prevent unhandled rejection

    const duration = Date.now() - startTime;
    console.log(`⏱️ Payment verification completed in ${duration}ms`);

    // Return success response immediately (don't wait for ticket email)
    return NextResponse.json(successResponse);
    
  } catch (error) {
    // Try to mark booking as failed if we have bookingId
    if (body?.bookingId) {
      try {
        const nowIstIso = getIstTimestamp();
        await supabase
          .from("bookings")
          .update({
            status: "FAILED",
            failureReason: error.message || "Unknown error",
            updatedAt: nowIstIso,
          })
          .eq("id", body.bookingId);
        
        try {
          const { data: bookingForPush } = await supabase
            .from("bookings")
            .select("id,userId,eventId")
            .eq("id", body.bookingId)
            .single();
          if (bookingForPush) {
            const { data: eventInfo } = await supabase
              .from("events")
              .select("id,title")
              .eq("id", bookingForPush.eventId)
              .single();
            await sendNotificationToUser(bookingForPush.userId, "payment-failed", {
              eventTitle: eventInfo?.title || "the event",
              eventId: bookingForPush.eventId,
            });
          }
        } catch (_) {}
      } catch (updateError) {
        console.error("Error updating booking status:", updateError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Payment verification failed",
        details: error?.message || "Unknown error occurred",
        errorType: error?.name || "Error",
      },
      { status: 500 }
    );
  }
}