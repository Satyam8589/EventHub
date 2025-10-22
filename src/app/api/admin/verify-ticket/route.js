import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/verify-ticket - Verify ticket for event admin
export async function POST(request) {
  try {
    const { ticketCode, eventId, adminUserId } = await request.json();

    if (!ticketCode || !eventId || !adminUserId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user is authorized to verify tickets for this event
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (
      !adminUser ||
      (adminUser.role !== "SUPER_ADMIN" && adminUser.role !== "EVENT_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // For event admins, check if they're assigned to this event
    if (adminUser.role === "EVENT_ADMIN") {
      const isAssigned = await prisma.eventAdmin.findFirst({
        where: {
          userId: adminUserId,
          eventId: eventId,
        },
      });

      if (!isAssigned) {
        return NextResponse.json({
          success: false,
          message: "You are not authorized to verify tickets for this event.",
        });
      }
    }

    // Find the booking by ticket code (using booking ID as ticket code)
    const booking = await prisma.booking.findFirst({
      where: {
        id: ticketCode,
        eventId: eventId,
        status: "CONFIRMED",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
            date: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({
        success: false,
        message: "Invalid ticket code or ticket not found for this event.",
      });
    }

    // Check if ticket was already verified
    const existingVerification = await prisma.ticketVerification.findFirst({
      where: {
        bookingId: booking.id,
      },
    });

    if (existingVerification) {
      return NextResponse.json({
        success: false,
        message: `Ticket already verified on ${new Date(
          existingVerification.scannedAt
        ).toLocaleString()}`,
        booking: booking,
      });
    }

    // Create verification record
    await prisma.ticketVerification.create({
      data: {
        bookingId: booking.id,
        scannedBy: adminUserId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ticket verified successfully! Entry granted.",
      booking: booking,
    });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    return NextResponse.json(
      { error: "Failed to verify ticket" },
      { status: 500 }
    );
  }
}
