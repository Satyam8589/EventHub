import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    if (!paymentId && !email) {
      return NextResponse.json(
        { error: "Payment ID or Email is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify admin access
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch booking with payment ID or email
    let bookingQuery = supabase
      .from("bookings")
      .select(
        `
        *,
        event:events(id, title, date, time, location, category, organizerId),
        user:users(id, name, email, phone, role, createdAt)
      `
      );

    if (paymentId) {
      bookingQuery = bookingQuery.eq("paymentId", paymentId);
    } else if (email) {
      // First get user by email
      const { data: targetUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (!targetUser) {
        return NextResponse.json(
          { error: "No user found with this email" },
          { status: 404 }
        );
      }

      bookingQuery = bookingQuery.eq("userId", targetUser.id);
    }


    const { data: bookings, error: bookingError } = await bookingQuery
      .order("createdAt", { ascending: false })
      .limit(1);

    if (bookingError || !bookings || bookings.length === 0) {
      return NextResponse.json(
        { error: email ? "No bookings found for this email" : "Booking not found with this payment ID" },
        { status: 404 }
      );
    }

    const booking = bookings[0];

    // Fetch verification logs
    const { data: verificationLogs } = await supabase
      .from("payment_verification_log")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false });

    // Fetch webhook events
    const { data: webhookEvents } = await supabase
      .from("webhook_events")
      .select("*")
      .eq("booking_id", booking.id)
      .order("received_at", { ascending: false });

    // Fetch ticket scans
    const { data: ticketScans } = await supabase
      .from("ticket_scans")
      .select("*")
      .eq("bookingId", booking.id)
      .order("scannedAt", { ascending: false });

    // Fetch all bookings by this user
    const { data: userBookings } = await supabase
      .from("bookings")
      .select(
        `
        id,
        status,
        totalAmount,
        paymentId,
        createdAt,
        event:events(title, date)
      `
      )
      .eq("userId", booking.userId)
      .order("createdAt", { ascending: false })
      .limit(10);

    // Fetch user's push subscriptions
    const { data: pushSubscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, created_at")
      .eq("user_id", booking.userId);

    // Calculate statistics
    const stats = {
      totalBookings: userBookings?.length || 0,
      confirmedBookings:
        userBookings?.filter((b) => b.status === "CONFIRMED").length || 0,
      totalSpent:
        userBookings
          ?.filter((b) => b.status === "CONFIRMED")
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0) || 0,
      ticketScansCount: ticketScans?.length || 0,
      verificationAttempts: verificationLogs?.length || 0,
      webhookEventsCount: webhookEvents?.length || 0,
      hasPushNotifications: (pushSubscriptions?.length || 0) > 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        booking,
        verificationLogs: verificationLogs || [],
        webhookEvents: webhookEvents || [],
        ticketScans: ticketScans || [],
        userBookings: userBookings || [],
        stats,
      },
    });
  } catch (error) {
    console.error("Payment lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
