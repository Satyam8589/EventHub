import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/check-booking?bookingId=xxx - Debug endpoint to check booking details
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    console.log("=== CHECKING BOOKING ===");
    console.log("Booking ID:", bookingId);
    console.log("Type:", typeof bookingId);

    // Try to find the booking
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
      // Try to find all bookings to see what IDs exist
      const allBookings = await prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          event: {
            select: {
              title: true,
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      return NextResponse.json({
        found: false,
        message: "Booking not found",
        searchedFor: bookingId,
        recentBookings: allBookings.map((b) => ({
          id: b.id,
          status: b.status,
          eventTitle: b.event.title,
          userName: b.user.name,
        })),
      });
    }

    return NextResponse.json({
      found: true,
      booking: {
        id: booking.id,
        status: booking.status,
        tickets: booking.tickets,
        totalAmount: booking.totalAmount,
        createdAt: booking.createdAt,
        user: booking.user,
        event: booking.event,
        verifications: booking.verifications.map((v) => ({
          scannedAt: v.scannedAt,
          isValid: v.isValid,
        })),
      },
      canScan:
        booking.status === "CONFIRMED" && booking.verifications.length === 0,
      reason:
        booking.status !== "CONFIRMED"
          ? `Booking status is ${booking.status} (must be CONFIRMED)`
          : booking.verifications.length > 0
          ? "Already scanned"
          : "Ready to scan",
    });
  } catch (error) {
    console.error("Error checking booking:", error);
    return NextResponse.json(
      {
        error: "Failed to check booking",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
