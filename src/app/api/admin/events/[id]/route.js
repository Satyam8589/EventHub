import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/events/[id] - Get single event with full details
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get organizer details
    const { data: organizer } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", event.organizerId)
      .single();

    // Get bookings count for this event
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("eventId", id);

    // Add additional data to event object
    const enrichedEvent = {
      ...event,
      organizer: organizer || null,
      _count: {
        bookings: bookings?.length || 0,
        reviews: 0, // TODO: Implement reviews if needed
      },
      gallery: event.gallery || [],
    };

    return NextResponse.json({ event: enrichedEvent });
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

    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({
        title,
        description,
        category,
        location,
        venue,
        date: eventDate.toISOString(),
        time: timeString,
        capacity: parseInt(capacity),
        price: parseFloat(price),
        featured: featured || false,
        organizerName,
        organizerEmail,
        organizerPhone,
        gallery: gallery || "",
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
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
