import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { sendTicketEmail, generateBookingEmailHTML } from "@/lib/email";
import { generateTicketImage } from "@/lib/generateTicketImage";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Log presence of Razorpay environment variables (helps debug misconfiguration)
console.log(
  "RAZORPAY ENV CHECK - key present:",
  !!process.env.RAZORPAY_KEY_ID,
  "secret present:",
  !!process.env.RAZORPAY_KEY_SECRET
);

// POST /api/payment/verify - Verify Razorpay payment
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = body;

    console.log("=== PAYMENT VERIFICATION REQUEST ===");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
    console.log("Booking ID:", bookingId);
    console.log("Signature present:", !!razorpay_signature);
    console.log("Full request body:", JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      bookingId,
      signatureLength: razorpay_signature?.length
    }, null, 2));

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

    console.log("=== SIGNATURE VERIFICATION ===");
    console.log("Generated Signature:", generatedSignature);
    console.log("Received Signature:", razorpay_signature);

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ SIGNATURE MISMATCH - PAYMENT VERIFICATION FAILED");

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

    console.log("✅ SIGNATURE VERIFIED - PAYMENT IS AUTHENTIC");

    // Get the pending booking
    // Temporarily using paymentId field where order ID is stored with PENDING_ prefix
    console.log("=== LOOKING FOR PENDING BOOKING ===");
    console.log("Booking ID to find:", bookingId);
    console.log("Expected paymentId:", `PENDING_${razorpay_order_id}`);

    // First, try to find by bookingId alone
    let { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    console.log("=== BOOKING QUERY RESULT (by ID) ===");
    console.log("Booking found:", !!booking);
    console.log("Booking error:", bookingError);
    if (booking) {
      console.log("Booking details:", {
        id: booking.id,
        paymentId: booking.paymentId,
        status: booking.status,
      });
    }

    if (bookingError || !booking) {
      console.error("❌ BOOKING NOT FOUND");
      console.error("Error details:", bookingError);
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if booking is already confirmed
    if (booking.status === "CONFIRMED") {
      console.log("⚠️ BOOKING ALREADY CONFIRMED - Duplicate verification attempt");
      return NextResponse.json(
        { 
          success: false, 
          error: "This payment has already been verified" 
        },
        { status: 400 }
      );
    }

    // Check if booking status is PENDING and paymentId matches
    if (booking.status !== "PENDING") {
      console.error("❌ BOOKING STATUS IS NOT PENDING:", booking.status);
      return NextResponse.json(
        { success: false, error: "Booking is not in pending state" },
        { status: 400 }
      );
    }

    // Verify that the order ID matches
    const expectedPaymentId = `PENDING_${razorpay_order_id}`;
    if (booking.paymentId !== expectedPaymentId) {
      console.error("❌ PAYMENT ID MISMATCH");
      console.error("Expected:", expectedPaymentId);
      console.error("Got:", booking.paymentId);
      return NextResponse.json(
        { success: false, error: "Payment ID mismatch - possible fraud attempt" },
        { status: 400 }
      );
    }

    console.log("=== BOOKING FOUND ===");
    console.log("Booking ID:", booking.id);
    console.log("Event ID:", booking.eventId);
    console.log("User ID:", booking.userId);

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
      console.error("❌ EVENT NOT FOUND");
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    if (userError || !user) {
      console.error("❌ USER NOT FOUND");
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
      console.error("❌ ERROR UPDATING BOOKING:", updateError);
      throw updateError;
    }

    console.log("✅ BOOKING CONFIRMED SUCCESSFULLY");

    // Generate and send ticket email
    try {
      console.log("📧 GENERATING AND SENDING TICKET EMAIL...");

      // Generate ticket image
      const ticketImageBuffer = await generateTicketImage(
        confirmedBooking,
        event,
        user
      );

      // Generate email HTML
      const emailHTML = generateBookingEmailHTML(confirmedBooking, event, user);

      // Send email with ticket attachment
      const emailResult = await sendTicketEmail({
        to: user.email,
        subject: `🎉 Payment Successful! Your Ticket for ${event.title}`,
        html: emailHTML,
        attachments: [
          {
            filename: `ticket-${confirmedBooking.id}.png`,
            content: ticketImageBuffer,
            contentType: "image/png",
          },
        ],
      });

      if (emailResult.success) {
        console.log(
          "✅ TICKET EMAIL SENT SUCCESSFULLY:",
          emailResult.messageId
        );
      } else {
        console.warn(
          "⚠️ FAILED TO SEND TICKET EMAIL:",
          emailResult.error || emailResult.message
        );
      }
    } catch (emailError) {
      console.error("❌ ERROR SENDING TICKET EMAIL:", emailError);
      // Don't fail the payment verification if email fails
    }

    // Return success response
    console.log("🎉 RETURNING SUCCESS RESPONSE TO CLIENT");
    console.log("Booking confirmed with ID:", confirmedBooking.id);
    console.log("Payment ID:", razorpay_payment_id);
    
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("❌ PAYMENT VERIFICATION ERROR:", error);

    // Try to mark booking as failed if we have bookingId
    if (body?.bookingId) {
      try {
        await supabase
          .from("bookings")
          .update({
            status: "FAILED",
            failureReason: error.message,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", body.bookingId);
      } catch (updateError) {
        console.error("Error updating booking to failed:", updateError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Payment verification failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
