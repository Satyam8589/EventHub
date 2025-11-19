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
      experienceHighlights,
    } = body;

    const eventDateISO = (() => {
      const dateStr = (date || "").trim();
      const timeStr = (time || "00:00").trim();
      const withOffset = `${dateStr}T${timeStr}:00+05:30`;
      const dt = new Date(withOffset);
      if (!isNaN(dt.getTime())) return dt.toISOString();
      const [yy, mm, dd] = dateStr.split("-").map(Number);
      const [hh, min] = timeStr.split(":").map(Number);
      return new Date(Date.UTC(yy, (mm || 1) - 1, dd || 1, hh || 0, min || 0)).toISOString();
    })();

    // Handle endDate if provided
    let eventEndDateISO = null;
    if (endDate || endTime) {
      const dateStr = (endDate || date || "").trim();
      const timeStr = (endTime || time || "00:00").trim();
      const withOffset = `${dateStr}T${timeStr}:00+05:30`;
      const dt = new Date(withOffset);
      eventEndDateISO = !isNaN(dt.getTime())
        ? dt.toISOString()
        : (() => {
            const [yy, mm, dd] = dateStr.split("-").map(Number);
            const [hh, min] = timeStr.split(":").map(Number);
            return new Date(
              Date.UTC(yy, (mm || 1) - 1, dd || 1, hh || 0, min || 0)
            ).toISOString();
          })();
    }

    // Try to update with provided fields
    let updateData = {
      title,
      description,
      category,
      location,
      venue,
      date: eventDateISO,
      time: time || "00:00",
      capacity: parseInt(capacity),
      price: parseFloat(price),
      featured: featured || false,
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

    // Handle missing columns by retrying with snake_case, then without optional fields
    if (updateError && updateError.code === "PGRST204") {
      if (updateError.message.includes("experienceHighlights")) {
        const { experienceHighlights, ...rest } = updateData;
        // Try snake_case first
        const updateDataSnake = { ...rest, experience_highlights: experienceHighlights };
        let { data: retryUpdatedEventSnake, error: retryUpdateErrorSnake } = await supabase
          .from("events")
          .update(updateDataSnake)
          .eq("id", id)
          .select()
          .single();
        updatedEvent = retryUpdatedEventSnake;
        updateError = retryUpdateErrorSnake;
        // If still missing, try lowercase
        if (updateError && updateError.code === "PGRST204" && updateError.message.includes("experience_highlights")) {
          const updateDataLower = { ...rest, experiencehighlights: experienceHighlights };
          const { data: retryUpdatedEventLower, error: retryUpdateErrorLower } = await supabase
            .from("events")
            .update(updateDataLower)
            .eq("id", id)
            .select()
            .single();
          updatedEvent = retryUpdatedEventLower;
          updateError = retryUpdateErrorLower;
        }
      }

      if (
        updateError &&
        updateError.code === "PGRST204" &&
        (updateError.message.includes("endDate") ||
          updateError.message.includes("enddate") ||
          updateError.message.includes("endTime") ||
          updateError.message.includes("endtime") ||
          updateError.message.includes("experienceHighlights") ||
          updateError.message.includes("experience_highlights") ||
          updateError.message.includes("experiencehighlights"))
      ) {
        const {
          enddate: _,
          endDate: __,
          endtime: ___,
          experienceHighlights: ____,
          experience_highlights: _____,
          experiencehighlights: ______,
          ...updateDataWithoutOptionalFields
        } = updateData;
        const { data: retryUpdatedEvent, error: retryUpdateError } = await supabase
          .from("events")
          .update(updateDataWithoutOptionalFields)
          .eq("id", id)
          .select()
          .single();
        updatedEvent = retryUpdatedEvent;
        updateError = retryUpdateError;
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
