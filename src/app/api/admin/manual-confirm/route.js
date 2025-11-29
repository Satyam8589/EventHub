import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();
    const { bookingId, userId, ticketQuantity, paymentId } = body;

    if (!bookingId || !userId) {
      return NextResponse.json(
        { error: "Booking ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify admin access
    const { data: admin, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (adminError || !admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        event:events(id, title, date, time, location, organizerId),
        user:users(id, name, email)
      `
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if already confirmed
    if (booking.status === "CONFIRMED") {
      return NextResponse.json(
        { error: "Booking is already confirmed" },
        { status: 400 }
      );
    }

    // Update ticket quantity if provided
    const finalTicketQuantity = ticketQuantity || booking.tickets;
    const ticketDifference = finalTicketQuantity - booking.tickets;

    // Only check availability if we're adding more tickets
    if (ticketDifference > 0) {
      const { data: event } = await supabase
        .from("events")
        .select("availableTickets")
        .eq("id", booking.eventId)
        .single();

      if (!event || event.availableTickets < ticketDifference) {
        return NextResponse.json(
          { error: "Not enough tickets available for the requested quantity" },
          { status: 400 }
        );
      }

      // Update event available tickets (reduce by the additional tickets)
      await supabase
        .from("events")
        .update({
          availableTickets: event.availableTickets - ticketDifference,
        })
        .eq("id", booking.eventId);
    } else if (ticketDifference < 0) {
      // If reducing tickets, add them back to available
      const { data: event } = await supabase
        .from("events")
        .select("availableTickets")
        .eq("id", booking.eventId)
        .single();

      if (event) {
        await supabase
          .from("events")
          .update({
            availableTickets: event.availableTickets + Math.abs(ticketDifference),
          })
          .eq("id", booking.eventId);
      }
    }

    // Update booking to CONFIRMED
    const updateData = {
      status: "CONFIRMED",
      tickets: finalTicketQuantity,
    };

    // Add payment ID if provided
    if (paymentId) {
      updateData.paymentId = paymentId;
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to confirm booking" },
        { status: 500 }
      );
    }

    // Send notification to user
    try {
      // Get user's push subscriptions
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", booking.userId);

      if (subscriptions && subscriptions.length > 0) {
        // Send push notification
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "https://www.eventhubx.site"}/api/notifications/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: booking.userId,
            title: "🎉 Tickets Confirmed!",
            body: `Your ${finalTicketQuantity} ticket(s) for "${booking.event.title}" have been confirmed by our support team. Check My Events to view your tickets!`,
            data: {
              type: "booking_confirmed",
              bookingId: bookingId,
              eventId: booking.eventId,
            },
          }),
        });
      }
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
      // Don't fail the request if notification fails
    }

    // Log the manual confirmation
    await supabase.from("admin_actions").insert({
      admin_id: userId,
      action_type: "manual_booking_confirmation",
      booking_id: bookingId,
      details: {
        original_tickets: booking.tickets,
        final_tickets: finalTicketQuantity,
        payment_id: booking.paymentId,
        user_email: booking.user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Booking confirmed successfully",
      booking: {
        id: updatedBooking.id,
        status: "CONFIRMED",
        tickets: finalTicketQuantity,
        event: booking.event,
      },
    });
  } catch (error) {
    console.error("Manual confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
