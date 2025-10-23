import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/confirm-booking - Manually confirm a booking
export async function POST(request) {
  try {
    const { bookingId, adminId } = await request.json();

    if (!bookingId || !adminId) {
      return NextResponse.json(
        { error: "Booking ID and admin ID are required" },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if the admin has permission to confirm this booking
    const eventAdmin = await prisma.eventAdmin.findUnique({
      where: {
        userId_eventId: {
          userId: adminId,
          eventId: booking.eventId,
        },
      },
    });

    if (!eventAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to confirm bookings for this event" },
        { status: 403 }
      );
    }

    // Update booking status to CONFIRMED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
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
      },
    });

    return NextResponse.json({
      success: true,
      message: "Booking confirmed successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error confirming booking:", error);
    return NextResponse.json(
      {
        error: "Failed to confirm booking",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
