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
// POST /api/payment/create-order - Create Razorpay order
export async function POST(request) {
  try {
    const now = new Date();
    const datePart = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const timePart = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
    const nowIstIso = `${datePart}T${timePart}+05:30`;
    const body = await request.json();
    const {
      userId,
      eventId,
      tickets,
      totalAmount,
      finalAmount,
      userDetails,
      discountCode,
      customFieldResponse,
    } = body;
    // Validate required fields
    if (!userId || !eventId || !tickets || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // ✅ DISCOUNT CODE VALIDATION
    let discountId = null;
    let discountAmount = 0;
    let originalAmount = totalAmount;
    let calculatedFinalAmount = totalAmount;

    if (discountCode && discountCode.trim()) {
      try {
        const { data: discount, error: discountError } = await supabase
          .from("event_discounts")
          .select("*")
          .eq("eventId", eventId)
          .eq("code", discountCode.toUpperCase())
          .eq("isActive", true)
          .single();

        if (discountError || !discount) {
          return NextResponse.json(
            { error: "Invalid discount code" },
            { status: 400 }
          );
        }

        // Check expiry
        if (discount.validUntil) {
          const nowCheck = new Date();
          const nowIST = new Date(
            nowCheck.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          const validUntil = new Date(discount.validUntil);

          if (nowIST > validUntil) {
            return NextResponse.json(
              { error: "Discount code has expired" },
              { status: 400 }
            );
          }
        }

        // Check max uses
        if (discount.maxUses && discount.currentUses >= discount.maxUses) {
          return NextResponse.json(
            { error: "Discount code usage limit reached" },
            { status: 400 }
          );
        }

        // Calculate discount
        const baseTotal = totalAmount;
        if (discount.type === "PERCENTAGE") {
          discountAmount = (baseTotal * discount.value) / 100;
        } else if (discount.type === "FIXED") {
          discountAmount = discount.value;
        }

        discountId = discount.id;
        originalAmount = totalAmount;
        calculatedFinalAmount = Math.max(0, totalAmount - discountAmount);

        console.log("✅ Discount applied:", {
          code: discountCode,
          discountId,
          type: discount.type,
          value: discount.value,
          discountAmount,
          originalAmount,
          calculatedFinalAmount,
        });
      } catch (error) {
        console.error("Error validating discount:", error);
        return NextResponse.json(
          { error: "Failed to validate discount" },
          { status: 500 }
        );
      }
    }

    // 🔒 ATOMIC AVAILABILITY CHECK
    // Use database function to atomically check availability with row-level locking
    // This prevents race conditions when multiple users check availability simultaneously
    const { data: availabilityResult, error: availabilityError } =
      await supabase.rpc("check_ticket_availability", {
        p_event_id: eventId,
        p_requested_tickets: parseInt(tickets),
      });

    if (availabilityError) {
      console.error("Availability check error:", availabilityError);
      // Fallback to old method if RPC fails (for backward compatibility)
      // ⚠️ IMPORTANT: Only count CONFIRMED bookings (not PENDING)
      const { data: existingBookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("tickets")
        .eq("eventId", eventId)
        .eq("status", "CONFIRMED"); // ✅ Only count CONFIRMED bookings

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
    } else {
      // Use the atomic check result
      if (!availabilityResult.success) {
        return NextResponse.json(
          {
            error: availabilityResult.error || "Not enough tickets available",
            availableTickets: availabilityResult.available_tickets,
            requestedTickets: availabilityResult.requested_tickets,
          },
          { status: 400 }
        );
      }
    }

    // If finalAmount is 0 or less, confirm booking immediately without Razorpay
    const amountToCharge =
      finalAmount !== undefined ? finalAmount : calculatedFinalAmount;
    if (parseFloat(amountToCharge) <= 0) {
      // ✅ Check ticket availability even for free bookings
      const { data: availabilityCheck, error: availError } = await supabase.rpc(
        "check_ticket_availability",
        {
          p_event_id: eventId,
          p_requested_tickets: parseInt(tickets),
        }
      );

      if (availError) {
        console.error("Availability check error for free booking:", availError);
        return NextResponse.json(
          { error: "Failed to check ticket availability" },
          { status: 500 }
        );
      }

      if (!availabilityCheck.success) {
        return NextResponse.json(
          {
            error: availabilityCheck.error || "Not enough tickets available",
            available_tickets: availabilityCheck.available_tickets || 0,
          },
          { status: 400 }
        );
      }

      const pendingBooking = {
        id: crypto.randomUUID(),
        userId,
        eventId,
        tickets: parseInt(tickets),
        totalAmount: 0,
        discountId: discountId || null,
        discountAmount: parseFloat(discountAmount) || 0,
        originalAmount: parseFloat(originalAmount) || 0,
        status: "CONFIRMED",
        paymentMethod: "free",
        paymentId: "FREE",
        custom_field_response: customFieldResponse || null,
        ticketgeneratedat: nowIstIso,
        createdAt: nowIstIso,
        updatedAt: nowIstIso,
      };

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert([pendingBooking])
        .select()
        .single();

      if (bookingError) {
        console.error("Free booking creation error:", bookingError);
        throw bookingError;
      }

      console.log("✅ Free booking created successfully:", booking.id);

      // ✅ INCREMENT DISCOUNT USAGE FOR FREE BOOKING
      if (discountId) {
        try {
          const { error: discountError } = await supabase.rpc(
            "increment_discount_usage",
            {
              p_discount_id: discountId,
            }
          );

          if (discountError) {
            console.error(
              "❌ Error incrementing discount usage:",
              discountError
            );
          } else {
            console.log(
              "✅ Discount usage incremented for free booking:",
              discountId
            );
          }
        } catch (discountError) {
          console.error(
            "❌ Exception incrementing discount usage:",
            discountError
          );
          // Don't fail booking if discount increment fails
        }
      }

      try {
        await sendNotificationToUser(userId, "booking-confirmed", {
          eventTitle: event.title,
          eventId: event.id,
        });
      } catch (_) {}

      // Update user profile with provided details
      if (
        userDetails &&
        (userDetails.name || userDetails.phone || userDetails.phoneNumber)
      ) {
        const updateData = {};
        if (userDetails.name) updateData.name = userDetails.name;
        if (userDetails.phone) updateData.phone = userDetails.phone;
        if (userDetails.phoneNumber) updateData.phone = userDetails.phoneNumber;
        updateData.updatedAt = nowIstIso;
        await supabase.from("users").update(updateData).eq("id", userId);
      }

      // 📧 SEND TICKET EMAIL FOR FREE BOOKING
      try {
        console.log("📧 Sending ticket email for free booking...");
        const ticketResult = await sendTicketToUser(booking.id, event);

        if (ticketResult.success) {
          console.log("✅ Ticket email sent successfully for free booking");
        } else {
          console.error("❌ Ticket email failed:", ticketResult.error);
        }
      } catch (emailError) {
        console.error("❌ Exception sending ticket email:", emailError);
        // Don't fail the booking if email fails
      }

      return NextResponse.json({
        success: true,
        free: true,
        bookingId: booking.id,
        amount: 0,
        currency: "INR",
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
        },
        userDetails,
      });
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
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amountToCharge * 100), // ✅ Use amountToCharge (discounted price) in paise
      currency: "INR",
      receipt: shortReceipt,
      notes: {
        eventId,
        userId,
        tickets: tickets.toString(),
        eventTitle: event.title,
      },
    });
    // 🔒 Create PENDING booking in database
    // ⚠️ IMPORTANT: PENDING bookings do NOT count in capacity
    // Capacity is only reduced when payment succeeds (status = CONFIRMED)
    // This prevents capacity reduction if user cancels payment
    // Temporarily store razorpay order ID in paymentId field with PENDING_ prefix
    // until database migration adds razorpayOrderId column
    const pendingBooking = {
      id: crypto.randomUUID(),
      userId,
      eventId,
      tickets: parseInt(tickets),
      totalAmount: parseFloat(amountToCharge),
      discountAmount: parseFloat(discountAmount) || 0,
      originalAmount: parseFloat(originalAmount),
      status: "PENDING",
      paymentMethod: "razorpay",
      paymentId: `PENDING_${razorpayOrder.id}`,
      discountId: discountId || null,
      custom_field_response: customFieldResponse || null,
      createdAt: nowIstIso,
      updatedAt: nowIstIso,
    };

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([pendingBooking])
      .select()
      .single();

    if (bookingError) {
      throw bookingError;
    }

    // ✅ PENDING booking created - capacity NOT reduced yet
    // Capacity will only be reduced when payment succeeds (CONFIRMED status)
    // If user cancels payment, PENDING booking remains but doesn't affect capacity

    // Send pending payment notification
    try {
      await sendNotificationToUser(userId, "payment-pending", {
        eventTitle: event.title,
        eventId: event.id,
      });
    } catch (_) {}

    // Update user profile with any new details provided during booking
    if (
      userDetails &&
      (userDetails.name || userDetails.phone || userDetails.phoneNumber)
    ) {
      const updateData = {};
      if (userDetails.name) updateData.name = userDetails.name;
      if (userDetails.phone) updateData.phone = userDetails.phone;
      if (userDetails.phoneNumber) updateData.phone = userDetails.phoneNumber; // Handle frontend phoneNumber field
      updateData.updatedAt = nowIstIso;
      const { error: userUpdateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (userUpdateError) {
        // Don't throw error here, just log it as it's not critical for payment
      } else {
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
    return NextResponse.json(
      {
        error: "Failed to create payment order",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
