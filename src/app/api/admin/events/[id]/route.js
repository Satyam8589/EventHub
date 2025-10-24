import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/events/[id] - Get single event with full details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        discounts: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Add gallery field if it doesn't exist (for backward compatibility)
    if (!event.gallery) {
      event.gallery = [];
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/events/[id] - Update event
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      description,
      category,
      date,
      location,
      venue,
      capacity,
      price,
      featured,
      organizerName,
      organizerEmail,
      organizerPhone,
      gallery,
    } = body;

    // Extract time from the date
    const eventDate = new Date(date);
    const timeString = eventDate.toTimeString().slice(0, 5); // Format: "HH:MM"

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        category,
        location,
        venue,
        date: eventDate,
        time: timeString,
        capacity: parseInt(capacity),
        price: parseFloat(price),
        featured: featured || false,
        organizerName,
        organizerEmail,
        organizerPhone,
        gallery: gallery || [],
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        discounts: true,
      },
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
