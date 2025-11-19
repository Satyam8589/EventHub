import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/events/[id] - Get a specific event
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    console.log("=== FETCHING EVENT DETAILS ===");
    console.log("Event ID:", id);

    // Fetch event with bookings count
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      console.log("Event not found:", id);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (error) {
      console.error("Error fetching event:", error);
      throw error;
    }

    // Get only CONFIRMED bookings for this event to sum up total tickets
    // PENDING bookings don't count because user might cancel payment
    // Capacity is only reduced when payment succeeds (CONFIRMED)
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("tickets")
      .eq("eventId", id)
      .eq("status", "CONFIRMED"); // ✅ Only count CONFIRMED bookings

    if (bookingsError) {
      console.error("Error counting bookings:", bookingsError);
    }

    // Sum up all tickets from CONFIRMED bookings for this event
    const totalTickets =
      bookings?.reduce((sum, booking) => sum + (booking.tickets || 0), 0) || 0;

    console.log("Event found:", event.title);
    console.log("Total tickets booked (CONFIRMED):", totalTickets);
    console.log("Capacity:", event.capacity);
    console.log("Available spots:", event.capacity - totalTickets);

    // Debug endtime fields
    console.log("=== DEBUG EVENT TIME FIELDS ===");
    console.log("event.time:", event.time);
    console.log("event.endtime:", event.endtime);
    console.log("event.endTime:", event.endTime);
    console.log("event.enddate:", event.enddate);
    console.log("event.endDate:", event.endDate);
    console.log("================================");

    // Add bookings count (total tickets) to event object
    const eventWithCount = {
      ...event,
      _count: {
        bookings: totalTickets, // Total tickets from CONFIRMED bookings
      },
    };

    return NextResponse.json(
      { event: eventWithCount },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update a specific event
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Prepare update data
    const updateData = {
      ...body,
      price: body.price ? parseFloat(body.price) : undefined,
      capacity: body.capacity ? parseInt(body.capacity) : undefined,
      date: body.date
        ? (() => {
            const dateStr = String(body.date).trim();
            const timeStr = String(body.time || "00:00").trim();
            const withOffset = `${dateStr}T${timeStr}:00+05:30`;
            const dt = new Date(withOffset);
            if (!isNaN(dt.getTime())) return dt.toISOString();
            const [yy, mm, dd] = dateStr.split("-").map(Number);
            const [hh, min] = timeStr.split(":").map(Number);
            return new Date(
              Date.UTC(yy, (mm || 1) - 1, dd || 1, hh || 0, min || 0)
            ).toISOString();
          })()
        : undefined,
    };

    // Add endDate if provided - use lowercase to match PostgreSQL column name
    if (body.endDate) {
      const dateStr = String(body.endDate).trim();
      const timeStr = String(body.endTime || body.time || "00:00").trim();
      const withOffset = `${dateStr}T${timeStr}:00+05:30`;
      const dt = new Date(withOffset);
      updateData.enddate = !isNaN(dt.getTime())
        ? dt.toISOString()
        : (() => {
            const [yy, mm, dd] = dateStr.split("-").map(Number);
            const [hh, min] = timeStr.split(":").map(Number);
            return new Date(
              Date.UTC(yy, (mm || 1) - 1, dd || 1, hh || 0, min || 0)
            ).toISOString();
          })();
    }

    let { data: event, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    // If endDate column doesn't exist, retry without endDate
    if (
      error &&
      error.code === "PGRST204" &&
      (error.message.includes("endDate") || error.message.includes("enddate"))
    ) {
      console.warn(
        "endDate column doesn't exist in database, updating without endDate"
      );

      // Remove endDate from update data
      const {
        enddate: _,
        endDate: __,
        ...updateDataWithoutEndDate
      } = updateData;

      const { data: retryEvent, error: retryError } = await supabase
        .from("events")
        .update(updateDataWithoutEndDate)
        .eq("id", id)
        .select("*")
        .single();

      event = retryEvent;
      error = retryError;
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete a specific event
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
