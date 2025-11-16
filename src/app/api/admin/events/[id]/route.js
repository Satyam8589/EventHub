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
      endDate,
      time,
      endTime,
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

    // ✅ Fix: Use time and endTime directly from form (preserve exact values)
    // Convert date to ISO string (date only, no time component)
    const eventDate = new Date(date + "T00:00:00"); // Add midnight to avoid timezone issues
    const eventDateISO = eventDate.toISOString().split("T")[0] + "T00:00:00.000Z";

    // Handle endDate if provided
    let eventEndDateISO = null;
    if (endDate) {
      const eventEndDate = new Date(endDate + "T00:00:00");
      eventEndDateISO = eventEndDate.toISOString().split("T")[0] + "T00:00:00.000Z";
    }

    // Try to update with endDate first, fall back without it if column doesn't exist
    let updateData = {
      title,
      description,
      category,
      location,
      venue,
      date: eventDateISO, // Date with time set to midnight UTC
      time: time || "00:00", // ✅ Use time directly from form (HH:MM format)
      capacity: parseInt(capacity),
      price: parseFloat(price),
      featured: featured || false,
      organizerName,
      organizerEmail,
      organizerPhone,
      gallery: gallery || "",
    };

    // Add endDate and endTime if provided - use lowercase to match PostgreSQL column name
    if (eventEndDateISO) {
      updateData.enddate = eventEndDateISO; // Use lowercase 'enddate'
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

    // If endDate or endTime columns don't exist, retry without them
    if (
      updateError &&
      updateError.code === "PGRST204" &&
      (updateError.message.includes("endDate") ||
        updateError.message.includes("enddate") ||
        updateError.message.includes("endTime") ||
        updateError.message.includes("endtime"))
    ) {
      console.warn(
        "endDate or endTime column doesn't exist in database, updating without them"
      );

      // Remove endDate and endTime from update data
      const {
        enddate: _,
        endDate: __,
        endtime: ___,
        ...updateDataWithoutOptionalFields
      } = updateData;

      const { data: retryUpdatedEvent, error: retryUpdateError } =
        await supabase
          .from("events")
          .update(updateDataWithoutOptionalFields)
          .eq("id", id)
          .select()
          .single();

      updatedEvent = retryUpdatedEvent;
      updateError = retryUpdateError;
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
