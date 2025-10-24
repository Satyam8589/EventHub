import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/scan-ticket - Scan and verify ticket
export async function POST(request) {
  try {
    const { bookingId, scannedBy, eventId } = await request.json();

    console.log("=== SCAN TICKET REQUEST ===");
    console.log("Booking ID received:", bookingId);
    console.log("Booking ID type:", typeof bookingId);
    console.log("Booking ID length:", bookingId?.length);
    console.log("Scanner ID:", scannedBy);
    console.log("Event ID:", eventId);

    if (!bookingId || !scannedBy || !eventId) {
      return NextResponse.json(
        { error: "Booking ID, scanner ID, and event ID are required" },
        { status: 400 }
      );
    }

    // Verify that the scanner is authorized (SUPER_ADMIN or EVENT_ADMIN)
    const { data: scanner, error: scannerError } = await supabase
      .from("users")
      .select("*")
      .eq("id", scannedBy)
      .single();

    if (
      scannerError ||
      !scanner ||
      (scanner.role !== "SUPER_ADMIN" && scanner.role !== "EVENT_ADMIN")
    ) {
      return NextResponse.json(
        { error: "You are not authorized to scan tickets for this event" },
        { status: 403 }
      );
    }

    // Get event details for validation
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        user:users(id, name, email),
        event:events(id, title, date, time)
      `
      )
      .eq("id", bookingId)
      .single();

    console.log("=== BOOKING LOOKUP RESULT ===");
    console.log("Booking found:", booking ? "YES" : "NO");
    if (booking) {
      console.log("Booking ID in DB:", booking.id);
      console.log("Booking Status:", booking.status);
      console.log("Event ID in booking:", booking.eventId);
      console.log("Event ID requested:", eventId);
    }

    if (bookingError || !booking) {
      return NextResponse.json(
        {
          error: "Invalid ticket",
          isValid: false,
          message: "Booking not found",
        },
        { status: 404 }
      );
    }

    // Check if booking is for the correct event
    if (booking.eventId !== eventId) {
      return NextResponse.json(
        {
          error: "Invalid ticket",
          isValid: false,
          message: "This ticket is not for this event",
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
          },
        },
        { status: 400 }
      );
    }

    // Check if booking is confirmed
    if (booking.status !== "CONFIRMED") {
      console.log("=== BOOKING NOT CONFIRMED ===");
      console.log("Status:", booking.status);

      return NextResponse.json(
        {
          error: "Invalid ticket",
          isValid: false,
          message: `Booking status is ${booking.status}. Only confirmed bookings are valid.`,
          details:
            "Please contact the event organizer to confirm this booking before scanning.",
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            userEmail: booking.user.email,
            status: booking.status,
            tickets: booking.tickets,
          },
        },
        { status: 400 }
      );
    }

    // Check if this booking has already been scanned
    // We'll use the paymentId field to store scan timestamp (creative use of existing field)
    if (booking.paymentId && booking.paymentId.startsWith("SCANNED_")) {
      const scannedTime = new Date(booking.paymentId.replace("SCANNED_", ""));
      return NextResponse.json(
        {
          error: "Ticket already scanned",
          isValid: false,
          message: `This ticket was already used on ${scannedTime.toLocaleString()}. Thank you for visiting, enjoy the event!`,
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            usedAt: booking.paymentId.replace("SCANNED_", ""),
          },
        },
        { status: 400 }
      );
    }

    // Mark ticket as scanned by updating paymentId with scan timestamp
    const scannedAt = new Date().toISOString();
    const { error: scanError } = await supabase
      .from("bookings")
      .update({
        paymentId: `SCANNED_${scannedAt}`,
        updatedAt: scannedAt,
      })
      .eq("id", booking.id);

    if (scanError) {
      console.error("Error marking ticket as scanned:", scanError);
      return NextResponse.json(
        { error: "Failed to process ticket scan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      isValid: true,
      message:
        "Ticket verified successfully. Entry allowed. Thank you for visiting, enjoy the event!",
      booking: {
        id: booking.id,
        eventTitle: booking.event.title,
        userName: booking.user.name,
        userEmail: booking.user.email,
        tickets: booking.tickets,
        totalAmount: booking.totalAmount,
        scannedAt: scannedAt,
        scannedBy: scanner.name,
        status: booking.status, // Keep original status
        isScanned: true,
      },
    });
  } catch (error) {
    console.error("Error scanning ticket:", error);
    return NextResponse.json(
      {
        error: "Failed to scan ticket",
        isValid: false,
        message: "An error occurred while processing the ticket",
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/scan-ticket?eventId=xxx - Get scanning statistics for event
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const scannerId = searchParams.get("scannerId");

    if (!eventId || !scannerId) {
      return NextResponse.json(
        { error: "Event ID and scanner ID are required" },
        { status: 400 }
      );
    }

    // Verify scanner is authorized (SUPER_ADMIN or EVENT_ADMIN)
    const { data: scanner, error: scannerError } = await supabase
      .from("users")
      .select("*")
      .eq("id", scannerId)
      .single();

    if (
      scannerError ||
      !scanner ||
      (scanner.role !== "SUPER_ADMIN" && scanner.role !== "EVENT_ADMIN")
    ) {
      return NextResponse.json(
        { error: "You are not authorized to access this event's data" },
        { status: 403 }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all confirmed bookings for this event
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        user:users(id, name, email)
      `
      )
      .eq("eventId", eventId)
      .eq("status", "CONFIRMED");

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch event data" },
        { status: 500 }
      );
    }

    const totalTickets = bookings.reduce(
      (sum, booking) => sum + booking.tickets,
      0
    );

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        capacity: event.capacity,
      },
      statistics: {
        totalBookings: bookings.length,
        totalTickets,
        confirmedBookings: bookings.length,
        availableTickets: event.capacity - totalTickets,
      },
      recentBookings: bookings.slice(-10).map((booking) => ({
        id: booking.id,
        userName: booking.user.name,
        userEmail: booking.user.email,
        tickets: booking.tickets,
        bookedAt: booking.createdAt,
        status: booking.status,
      })),
    });
  } catch (error) {
    console.error("Error getting scan statistics:", error);
    return NextResponse.json(
      { error: "Failed to get statistics" },
      { status: 500 }
    );
  }
}
