import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/events/[id] - Get a specific event
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (error) {
      throw error;
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

// PUT /api/events/[id] - Update a specific event
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: event, error } = await supabase
      .from("events")
      .update({
        ...body,
        price: body.price ? parseFloat(body.price) : undefined,
        capacity: body.capacity ? parseInt(body.capacity) : undefined,
        date: body.date ? new Date(body.date).toISOString() : undefined,
      })
      .eq("id", id)
      .select("*")
      .single();

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
