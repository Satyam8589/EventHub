import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabase } from "@/lib/supabase";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order - Create Razorpay order
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, eventId, tickets, totalAmount, userDetails } = body;

    console.log("=== CREATE PAYMENT ORDER REQUEST ===");
    console.log("User ID:", userId);
    console.log("Event ID:", eventId);
    console.log("Tickets:", tickets);
    console.log("Total Amount:", totalAmount);

    // Validate required fields
    if (!userId || !eventId || !tickets || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if event exists and has capacity
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Calculate current bookings to check capacity
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("tickets")
      .eq("eventId", eventId)
      .in("status", ["CONFIRMED", "PENDING"]);

    if (bookingsError) {
      throw bookingsError;
    }

    const totalBookedTickets = existingBookings.reduce(
      (sum, booking) => sum + booking.tickets,
      0
    );

    if (totalBookedTickets + tickets > event.capacity) {
      return NextResponse.json(
        { error: "Not enough tickets available" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    // Generate short receipt (max 40 chars)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const eventIdShort = eventId.slice(-8); // Last 8 chars of event ID
    const userIdShort = userId.slice(-8); // Last 8 chars of user ID
    const shortReceipt = `EH_${eventIdShort}_${userIdShort}_${timestamp}`.slice(
      0,
      40
    );

    console.log(
      "Generated receipt:",
      shortReceipt,
      "Length:",
      shortReceipt.length
    );

    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Razorpay expects amount in paise (multiply by 100)
      currency: "INR",
      receipt: shortReceipt,
      notes: {
        eventId,
        userId,
        tickets: tickets.toString(),
        eventTitle: event.title,
      },
    });

    console.log("=== RAZORPAY ORDER CREATED ===");
    console.log("Order ID:", razorpayOrder.id);
    console.log("Amount:", razorpayOrder.amount);

    // Create pending booking in database
    // Temporarily store razorpay order ID in paymentId field with PENDING_ prefix
    // until database migration adds razorpayOrderId column
    const pendingBooking = {
      id: crypto.randomUUID(),
      userId,
      eventId,
      tickets: parseInt(tickets),
      totalAmount: parseFloat(totalAmount),
      status: "PENDING",
      paymentMethod: "razorpay",
      paymentId: `PENDING_${razorpayOrder.id}`, // Temporary: store order ID here
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([pendingBooking])
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating pending booking:", bookingError);
      throw bookingError;
    }

    console.log("=== PENDING BOOKING CREATED ===");
    console.log("Booking ID:", booking.id);

    // Update user profile with any new details provided during booking
    if (userDetails && (userDetails.name || userDetails.phone)) {
      const updateData = {};
      if (userDetails.name) updateData.name = userDetails.name;
      if (userDetails.phone) updateData.phone = userDetails.phone;
      updateData.updatedAt = new Date().toISOString();

      console.log("🔄 Updating user profile with:", updateData, "for userId:", userId);

      const { error: userUpdateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (userUpdateError) {
        console.error("❌ Could not update user profile:", userUpdateError);
        // Don't throw error here, just log it as it's not critical for payment
      } else {
        console.log("✅ User profile updated successfully");
      }
    }

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      bookingId: booking.id,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
      },
      userDetails,
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment order",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
