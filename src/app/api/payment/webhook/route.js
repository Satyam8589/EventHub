import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { sendNotificationToUser } from "@/lib/notificationHelper";
import { sendTicketToUser } from "@/lib/ticketEmail";

// ⚡ Route segment config for Vercel deployment
export const runtime = 'nodejs';
export const maxDuration = 60;

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

// POST /api/payment/webhook - Razorpay webhook handler
export async function POST(request) {
  const startTime = Date.now();
  
  try {
    console.log("🔔 Webhook received at:", new Date().toISOString());
    
    // Get webhook signature from headers
    const webhookSignature = request.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("❌ RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }
    
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    
    if (webhookSignature !== expectedSignature) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    
    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    
    console.log("✅ Webhook signature verified, event:", event);
    
    // Handle different webhook events
    switch (event) {
      case "payment.captured":
        return await handlePaymentCaptured(payload);
      
      case "payment.failed":
        return await handlePaymentFailed(payload);
      
      default:
        console.log("ℹ️ Unhandled webhook event:", event);
        return NextResponse.json({ received: true });
    }
    
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}

// Handle payment.captured event
async function handlePaymentCaptured(payload) {
  try {
    const payment = payload.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    
    console.log("💰 Processing payment.captured:", { orderId, paymentId });
    
    // Find the booking with this order ID
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("paymentId", `PENDING_${orderId}`)
      .eq("status", "PENDING")
      .single();
    
    if (bookingError || !booking) {
      console.log("⚠️ No pending booking found for order:", orderId);
      // This might be a duplicate webhook or already processed
      // Check if already confirmed
      const { data: confirmedBooking } = await supabase
        .from("bookings")
        .select("id, status, paymentId")
        .eq("paymentId", paymentId)
        .eq("status", "CONFIRMED")
        .single();
      
      if (confirmedBooking) {
        console.log("✅ Booking already confirmed via webhook/client");
        return NextResponse.json({ 
          received: true, 
          message: "Already processed" 
        });
      }
      
      console.error("❌ Booking not found for order:", orderId);
      return NextResponse.json({ 
        received: true, 
        error: "Booking not found" 
      });
    }
    
    console.log("📋 Found booking:", booking.id);
    
    // Use atomic confirmation function
    const { data: confirmationResult, error: rpcError } = await supabase.rpc(
      "confirm_booking_with_availability_check",
      {
        p_booking_id: booking.id,
        p_payment_id: paymentId,
      }
    );
    
    if (rpcError) {
      console.error("❌ RPC Error:", rpcError);
      throw new Error(`Database function error: ${rpcError.message}`);
    }
    
    const result = confirmationResult;
    
    if (!result.success) {
      console.error("❌ Booking confirmation failed:", result.error);
      
      // Mark booking as failed
      const nowIstIso = getIstTimestamp();
      await supabase
        .from("bookings")
        .update({
          status: "FAILED",
          failureReason: result.error || "Webhook confirmation failed",
          updatedAt: nowIstIso,
        })
        .eq("id", booking.id);
      
      // Notify user of failure
      try {
        const { data: eventInfo } = await supabase
          .from("events")
          .select("id, title")
          .eq("id", booking.eventId)
          .single();
        
        await sendNotificationToUser(booking.userId, "payment-failed", {
          eventTitle: eventInfo?.title || "the event",
          eventId: booking.eventId,
        });
      } catch (_) {}
      
      return NextResponse.json({ 
        received: true, 
        error: result.error 
      });
    }
    
    // Extract booking and event from result
    const confirmedBooking = result.booking;
    const eventInfo = result.event;
    
    console.log("✅ Booking confirmed via webhook:", confirmedBooking.id);
    
    // Update verification metadata
    try {
      const nowIstIso = getIstTimestamp();
      await supabase
        .from("bookings")
        .update({
          paymentVerifiedAt: nowIstIso,
          ticketgeneratedat: nowIstIso,
          updatedAt: nowIstIso,
        })
        .eq("id", booking.id);
    } catch (_) {}
    
    // Increment discount usage if applicable
    if (confirmedBooking.discountId) {
      try {
        await supabase.rpc("increment_discount_usage", { 
          discount_id: confirmedBooking.discountId 
        });
        console.log("✅ Discount usage incremented");
      } catch (error) {
        console.error("❌ Error incrementing discount:", error);
      }
    }
    
    // Send success notification
    try {
      await sendNotificationToUser(confirmedBooking.userId, "payment-success", {
        eventTitle: eventInfo?.title || "the event",
        eventId: eventInfo?.id,
      });
    } catch (_) {}
    
    // Send ticket email
    try {
      const ticketResult = await sendTicketToUser(confirmedBooking.id, eventInfo);
      
      if (ticketResult.success) {
        console.log("✅ Ticket email sent via webhook");
        
        // Send ticket notification
        try {
          await sendNotificationToUser(confirmedBooking.userId, "ticket-sent", {
            eventTitle: eventInfo?.title || "the event",
            eventId: eventInfo?.id,
          });
        } catch (_) {}
      } else {
        console.error("❌ Ticket email failed:", ticketResult.error);
      }
    } catch (error) {
      console.error("❌ Error sending ticket email:", error);
    }
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Webhook processed in ${duration}ms`);
    
    return NextResponse.json({ 
      received: true, 
      message: "Payment processed successfully" 
    });
    
  } catch (error) {
    console.error("❌ Error handling payment.captured:", error);
    return NextResponse.json(
      { received: true, error: error.message },
      { status: 500 }
    );
  }
}

// Handle payment.failed event
async function handlePaymentFailed(payload) {
  try {
    const payment = payload.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const errorDescription = payment.error_description || "Payment failed";
    
    console.log("❌ Processing payment.failed:", { orderId, paymentId });
    
    // Find the booking with this order ID
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("paymentId", `PENDING_${orderId}`)
      .single();
    
    if (bookingError || !booking) {
      console.log("⚠️ No booking found for failed payment:", orderId);
      return NextResponse.json({ received: true });
    }
    
    // Mark booking as failed
    const nowIstIso = getIstTimestamp();
    await supabase
      .from("bookings")
      .update({
        status: "FAILED",
        failureReason: errorDescription,
        updatedAt: nowIstIso,
      })
      .eq("id", booking.id);
    
    console.log("✅ Booking marked as failed:", booking.id);
    
    // Notify user
    try {
      const { data: eventInfo } = await supabase
        .from("events")
        .select("id, title")
        .eq("id", booking.eventId)
        .single();
      
      await sendNotificationToUser(booking.userId, "payment-failed", {
        eventTitle: eventInfo?.title || "the event",
        eventId: booking.eventId,
      });
    } catch (_) {}
    
    return NextResponse.json({ 
      received: true, 
      message: "Payment failure processed" 
    });
    
  } catch (error) {
    console.error("❌ Error handling payment.failed:", error);
    return NextResponse.json(
      { received: true, error: error.message },
      { status: 500 }
    );
  }
}
