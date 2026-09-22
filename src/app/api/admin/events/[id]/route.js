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

    // Get discounts for this event
    const { data: discounts } = await supabase
      .from("event_discounts")
      .select("*")
      .eq("eventId", id)
      .order("createdAt", { ascending: false });

    // Add additional data to event object
    const enrichedEvent = {
      ...event,
      organizer: organizer || null,
      _count: {
        bookings: bookings?.length || 0,
        reviews: 0, // TODO: Implement reviews if needed
      },
      gallery: event.gallery || [],
      discounts: discounts || [],
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
      endDate,
      time,
      endTime,
      location,
      latitude,
      longitude,
      venue,
      capacity,
      price,
      featured,
      booking_closed,
      organizerName,
      organizerEmail,
      organizerPhone,
      gallery,
      experienceHighlights,
    } = body;

    const [y, m, d] = (date || "").split("-").map(Number);
    const [hh, mm] = (time || "00:00").split(":").map(Number);
    const eventDateISO = new Date(
      Date.UTC(y, (m || 1) - 1, d || 1, (hh || 0) - 5, (mm || 0) - 30)
    ).toISOString();

    // Handle endDate if provided
    let eventEndDateISO = null;
    if (endDate || endTime) {
      const [ey, em, ed] = (endDate || date || "").split("-").map(Number);
      const [ehh, emm] = (endTime || time || "00:00").split(":").map(Number);
      eventEndDateISO = new Date(
        Date.UTC(ey, (em || 1) - 1, ed || 1, (ehh || 0) - 5, (emm || 0) - 30)
      ).toISOString();
    }

    // Try to update with provided fields
    let updateData = {
      title,
      description,
      category,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      venue,
      date: eventDateISO,
      time: time || "00:00",
      capacity: parseInt(capacity),
      price: parseFloat(price),
      featured: featured || false,
      booking_closed: booking_closed || false,
      show_discount_field: body.show_discount_field !== false,
      show_custom_field: body.show_custom_field || false,
      custom_field_label: body.custom_field_label || null,
      organizerName,
      organizerEmail,
      organizerPhone,
      gallery: gallery || "",
      experienceHighlights: experienceHighlights || null,
    };

    // Add endDate and endTime if provided - use lowercase to match PostgreSQL column name
    if (eventEndDateISO) {
      updateData.enddate = eventEndDateISO;
    }
    if (endTime) {
      updateData.endtime = endTime; // ✅ Use endTime directly from form (HH:MM format)
    }

    let { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    // Dynamic retry: If any column is missing in schema cache (PGRST204), remove it and retry
    let retries = 0;
    while (updateError && updateError.code === "PGRST204" && retries < 5) {
      retries++;
      const match = updateError.message.match(/Could not find the '([^']+)' column/);
      if (match && match[1]) {
        const missingCol = match[1];
        console.warn(`Column '${missingCol}' missing in database, retrying update without it.`);
        delete updateData[missingCol];

        const retryResult = await supabase
          .from("events")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        updatedEvent = retryResult.data;
        updateError = retryResult.error;
      } else {
        break;
      }
    }

    if (updateError) {
      throw updateError;
    }

    // Return the updated event with enriched data
    const { data: organizer } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", updatedEvent.organizerId)
      .single();

    const enrichedUpdatedEvent = {
      ...updatedEvent,
      organizer: organizer || null,
    };

    return NextResponse.json({ event: enrichedUpdatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
