import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { sendNotificationToUser } from "@/lib/notificationHelper";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Log presence of Razorpay environment variables (helps debug misconfiguration)
// POST /api/payment/verify - Verify Razorpay payment
export async function POST(request) {
  let body = null;

  try {
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
      // Mark booking as failed
      const nowIstIso = (() => {
        const now = new Date();
        const datePart = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
        const timePart = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
        return `${datePart}T${timePart}+05:30`;
      })();
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
    // Temporarily using paymentId field where order ID is stored with PENDING_ prefix
    // First, try to find by bookingId alone
    let { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    console.log("=== BOOKING QUERY RESULT (by ID) ===");
    if (booking) {
    }

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
    // Use database function to atomically check availability and confirm booking
    // This prevents race conditions when multiple users try to book the last ticket
    const { data: confirmationResult, error: rpcError } = await supabase.rpc(
      "confirm_booking_with_availability_check",
      {
        p_booking_id: bookingId,
        p_payment_id: razorpay_payment_id,
      }
    );

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      // Fallback to old method if RPC fails (for backward compatibility)
      // But this should not happen if migration is applied
      throw new Error(
        `Database function error: ${rpcError.message}. Please ensure the database migration has been applied.`
      );
    }

    // Parse the JSONB result from the function
    const result = confirmationResult;

    if (!result.success) {
      // Booking could not be confirmed (likely overselling prevented)
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

    // ✅ paymentId is now stored in database with the actual Razorpay transaction ID
    // Use the stored paymentId from the confirmed booking (not the variable)
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
        paymentId: storedPaymentId, // ✅ Transaction ID stored in database
        event: {
          id: eventInfo.id,
          title: eventInfo.title,
          // Get additional event details if needed
        },
      },
    };

    // Use event details returned from the confirmation function (avoids type mismatch issues)
    if (eventInfo) {
      successResponse.booking.event = {
        id: eventInfo.id,
        title: eventInfo.title,
        date: eventInfo.date,
        time: eventInfo.time,
        location: eventInfo.location,
      };
    }

    // Persist verification metadata on booking
    try {
      const nowIstIso = (() => {
        const now = new Date();
        const datePart = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
        const timePart = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
        return `${datePart}T${timePart}+05:30`;
      })();
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
        }
      }
    } catch (_) {}

    try {
      await sendNotificationToUser(confirmedBooking.userId, "payment-success", {
        eventTitle: eventInfo?.title || "the event",
        eventId: eventInfo?.id,
      });
    } catch (_) {}

    // Return success response
    return NextResponse.json(successResponse);
  } catch (error) {
    // Try to mark booking as failed if we have bookingId
    if (body?.bookingId) {
      try {
        const nowIstIso = (() => {
          const now = new Date();
          const datePart = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
          const timePart = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
          return `${datePart}T${timePart}+05:30`;
        })();
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
