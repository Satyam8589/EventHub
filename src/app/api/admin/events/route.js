import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/events - Get events for admin
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get("adminUserId");

    let events;

    if (adminUserId) {
      // Get user to check their role
      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", adminUserId)
        .single();

      if (user?.role === "EVENT_ADMIN") {
        // Event Admin - get only events they created
        const { data: adminEvents } = await supabase
          .from("events")
          .select("*")
          .eq("organizerId", adminUserId);

        events = adminEvents || [];
      } else {
        // Super Admin - get all events
        const { data: allEvents } = await supabase.from("events").select("*");

        events = allEvents || [];
      }
    } else {
      // No admin user ID provided - get all events
      const { data: allEvents } = await supabase
        .from("events")
        .select("*")
        .order("createdAt", { ascending: false });

      events = allEvents || [];
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching admin events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/admin/events - Create new event (Super Admin only)
export async function POST(request) {
  try {
    const data = await request.json();
    const {
      title,
      description,
      category,
      location,
      venue,
      date,
      time,
      price,
      capacity,
      imageUrl,
      tags,
      organizerId,
    } = data;

    // Validate required fields
    if (!title || !description || !date || !time || !location || !organizerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the event
    const { data: event, error: createError } = await supabase
      .from("events")
      .insert([
        {
          title,
          description,
          category: category || "CONFERENCE",
          location,
          venue: venue || location,
          date: new Date(date).toISOString(),
          time,
          price: parseFloat(price) || 0,
          capacity: parseInt(capacity) || 100,
          imageUrl,
          tags: tags || [],
          organizerId,
          status: "UPCOMING",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (createError) {
      console.error("Error creating event:", createError);
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
