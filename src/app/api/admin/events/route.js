import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/events - Get events for admin
export async function GET(request) {
  try {
    console.log("=== ADMIN EVENTS API CALLED ===");
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get("adminUserId");
    console.log("Admin User ID:", adminUserId);

    let events;

    if (adminUserId) {
      // Get user to check their role
      console.log("Fetching user role for:", adminUserId);
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", adminUserId)
        .single();

      console.log("User role query result:", { user, error: userError });

      if (user?.role === "EVENT_ADMIN") {
        // Event Admin - get only events they created
        console.log("Fetching events for EVENT_ADMIN:", adminUserId);
        const { data: adminEvents, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .eq("organizerId", adminUserId);

        console.log("EVENT_ADMIN events result:", {
          adminEvents,
          error: eventsError,
        });
        events = adminEvents || [];
      } else {
        // Super Admin - get all events
        console.log("Fetching all events for SUPER_ADMIN");
        const { data: allEvents, error: allEventsError } = await supabase
          .from("events")
          .select("*");

        console.log("SUPER_ADMIN events result:", {
          allEvents,
          error: allEventsError,
        });
        events = allEvents || [];
      }
    } else {
      // No admin user ID provided - get all events
      console.log("No admin user ID provided - fetching all events");
      const { data: allEvents, error: allEventsError } = await supabase
        .from("events")
        .select("*")
        .order("createdAt", { ascending: false });

      console.log("All events result:", { allEvents, error: allEventsError });
      events = allEvents || [];
    }

    console.log("Final events count:", events.length);
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
          id: crypto.randomUUID(), // Generate unique ID
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
