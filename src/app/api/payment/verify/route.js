import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

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
      await supabase
        .from("bookings")
        .update({
          status: "FAILED",
          failureReason: "Payment signature verification failed",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", bookingId);

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
    // Get event and user details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", booking.eventId)
      .single();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", booking.userId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update booking to CONFIRMED
    const { data: confirmedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "CONFIRMED",
        paymentId: razorpay_payment_id, // Now store actual payment ID
        // razorpayOrderId: razorpay_order_id, // TODO: Add this after database migration
        updatedAt: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }
    // Prepare success response FIRST before trying email
    const successResponse = {
      success: true,
      message:
        "Payment verified successfully! Your tickets have been confirmed.",
      booking: {
        id: confirmedBooking.id,
        status: confirmedBooking.status,
        tickets: confirmedBooking.tickets,
        totalAmount: confirmedBooking.totalAmount,
        paymentId: razorpay_payment_id,
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
        },
      },
    };

    // Return success response
    return NextResponse.json(successResponse);
  } catch (error) {
    // Try to mark booking as failed if we have bookingId
    if (body?.bookingId) {
      try {
        await supabase
          .from("bookings")
          .update({
            status: "FAILED",
            failureReason: error.message || "Unknown error",
            updatedAt: new Date().toISOString(),
          })
          .eq("id", body.bookingId);
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
