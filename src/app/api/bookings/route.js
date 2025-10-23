import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTicketEmail, generateBookingEmailHTML } from "@/lib/email";
import { generateTicketImage } from "@/lib/generateTicketImage";

// GET /api/bookings - Get all bookings (with optional user filter)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const bookings = await prisma.booking.findMany({
      where: userId ? { userId } : undefined,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            time: true,
            location: true,
            venue: true,
            imageUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        verifications: {
          select: {
            id: true,
            scannedAt: true,
            isValid: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, eventId, tickets, totalAmount, paymentMethod } = body;

    // Validate required fields
    if (!userId || !eventId || !tickets || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if event exists and has capacity
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Calculate current bookings
    const currentBookings = await prisma.booking.aggregate({
      where: {
        eventId,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      _sum: {
        tickets: true,
      },
    });

    const totalBookedTickets = currentBookings._sum.tickets || 0;

    if (totalBookedTickets + tickets > event.capacity) {
      return NextResponse.json(
        { error: "Not enough tickets available" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        eventId,
        tickets: parseInt(tickets),
        totalAmount: parseFloat(totalAmount),
        paymentMethod,
        status: "CONFIRMED", // For now, we'll auto-confirm bookings
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            time: true,
            location: true,
            venue: true,
            imageUrl: true,
            organizerName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send ticket email (don't wait for it to avoid blocking response)
    // Wrap in try-catch so booking still succeeds even if email fails
    setImmediate(async () => {
      try {
        console.log("Sending ticket email to:", booking.user.email);

        // Generate ticket image
        const ticketImageBuffer = await generateTicketImage(
          booking,
          booking.event,
          booking.user
        );

        // Generate email HTML
        const emailHTML = generateBookingEmailHTML(
          booking,
          booking.event,
          booking.user
        );

        // Send email with ticket attachment
        const emailResult = await sendTicketEmail({
          to: booking.user.email,
          subject: `🎉 Your Ticket for ${booking.event.title} - Booking Confirmed!`,
          html: emailHTML,
          attachments: [
            {
              filename: `ticket-${booking.id}.png`,
              content: ticketImageBuffer,
              contentType: "image/png",
            },
          ],
        });

        if (emailResult.success) {
          console.log(
            "✅ Ticket email sent successfully:",
            emailResult.messageId
          );
        } else {
          console.warn(
            "⚠️ Failed to send ticket email:",
            emailResult.error || emailResult.message
          );
        }
      } catch (emailError) {
        console.error("❌ Error sending ticket email:", emailError);
        // Don't throw - we don't want email errors to affect booking
      }
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
