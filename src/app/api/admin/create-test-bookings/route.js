import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/create-test-bookings - Create test bookings for QR testing
export async function POST(request) {
  try {
    const { eventId, userId } = await request.json();

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: "Event ID and User ID are required" },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Create test bookings with predictable IDs
    const testBookings = [
      {
        id: "booking_test_001",
        eventId,
        userId,
        tickets: 2,
        totalAmount: 100,
        status: "CONFIRMED",
      },
      {
        id: "booking_test_002",
        eventId,
        userId,
        tickets: 1,
        totalAmount: 50,
        status: "CONFIRMED",
      },
      {
        id: "booking_test_003",
        eventId,
        userId,
        tickets: 3,
        totalAmount: 150,
        status: "CONFIRMED",
      },
    ];

    // Create bookings (use upsert to avoid duplicates)
    const createdBookings = [];
    for (const booking of testBookings) {
      const createdBooking = await prisma.booking.upsert({
        where: { id: booking.id },
        update: booking,
        create: booking,
      });
      createdBookings.push(createdBooking);
    }

    return NextResponse.json({
      success: true,
      bookings: createdBookings,
      message: "Test bookings created successfully",
    });
  } catch (error) {
    console.error("Error creating test bookings:", error);
    return NextResponse.json(
      { error: "Failed to create test bookings" },
      { status: 500 }
    );
  }
}
