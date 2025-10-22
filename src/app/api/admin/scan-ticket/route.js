import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/scan-ticket - Scan and verify ticket
export async function POST(request) {
  try {
    const { bookingId, scannedBy, eventId } = await request.json();

    if (!bookingId || !scannedBy || !eventId) {
      return NextResponse.json(
        { error: "Booking ID, scanner ID, and event ID are required" },
        { status: 400 }
      );
    }

    // Verify that the scanner is an admin of this event
    const eventAdmin = await prisma.eventAdmin.findUnique({
      where: { userId_eventId: { userId: scannedBy, eventId: eventId } },
      include: { user: true, event: true },
    });

    if (!eventAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to scan tickets for this event" },
        { status: 403 }
      );
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
          },
        },
        verifications: true,
      },
    });

    if (!booking) {
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

    // Check if ticket has already been verified
    if (booking.verifications.length > 0) {
      const existingVerification = booking.verifications[0];
      return NextResponse.json(
        {
          error: "Ticket already scanned",
          isValid: false,
          message: `This ticket was already verified on ${new Date(
            existingVerification.scannedAt
          ).toLocaleString()}`,
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            verifiedAt: existingVerification.scannedAt,
          },
        },
        { status: 400 }
      );
    }

    // Check if booking is confirmed
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        {
          error: "Invalid ticket",
          isValid: false,
          message: `Booking status is ${booking.status}. Only confirmed bookings are valid.`,
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            status: booking.status,
          },
        },
        { status: 400 }
      );
    }

    // Create verification record
    const verification = await prisma.ticketVerification.create({
      data: {
        bookingId: booking.id,
        scannedBy: scannedBy,
        isValid: true,
        notes: `Verified by ${eventAdmin.user.name} for ${eventAdmin.event.title}`,
      },
    });

    return NextResponse.json({
      isValid: true,
      message: "Ticket verified successfully. Entry allowed.",
      booking: {
        id: booking.id,
        eventTitle: booking.event.title,
        userName: booking.user.name,
        userEmail: booking.user.email,
        tickets: booking.tickets,
        totalAmount: booking.totalAmount,
        verifiedAt: verification.scannedAt,
        verifiedBy: eventAdmin.user.name,
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

    // Verify scanner is admin of this event
    const eventAdmin = await prisma.eventAdmin.findUnique({
      where: { userId_eventId: { userId: scannerId, eventId: eventId } },
    });

    if (!eventAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to access this event's data" },
        { status: 403 }
      );
    }

    // Get event statistics
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: {
          where: { status: "CONFIRMED" },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            verifications: true,
          },
        },
        _count: {
          select: {
            bookings: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const totalTickets = event.bookings.reduce(
      (sum, booking) => sum + booking.tickets,
      0
    );
    const verifiedBookings = event.bookings.filter(
      (booking) => booking.verifications.length > 0
    );
    const verifiedTickets = verifiedBookings.reduce(
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
        totalBookings: event.bookings.length,
        totalTickets,
        verifiedBookings: verifiedBookings.length,
        verifiedTickets,
        pendingVerification: event.bookings.length - verifiedBookings.length,
      },
      recentVerifications: verifiedBookings.slice(-10).map((booking) => ({
        id: booking.id,
        userName: booking.user.name,
        userEmail: booking.user.email,
        tickets: booking.tickets,
        verifiedAt: booking.verifications[0].scannedAt,
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
