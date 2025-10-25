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
        // Event Admin - get only events they are assigned to via junction table
        console.log("Fetching assigned events for EVENT_ADMIN:", adminUserId);

        // First get the event assignments
        const { data: assignments, error: assignmentError } = await supabase
          .from("event_admins")
          .select("event_id")
          .eq("user_id", adminUserId);

        if (assignmentError) {
          console.error("Error fetching assigned events:", assignmentError);
          events = [];
        } else if (!assignments || assignments.length === 0) {
          console.log("EVENT_ADMIN has no assigned events");
          events = [];
        } else {
          // Get the actual events
          const eventIds = assignments.map((a) => a.event_id);
          const { data: adminEvents, error: eventsError } = await supabase
            .from("events")
            .select("*")
            .in("id", eventIds);

          if (eventsError) {
            console.error("Error fetching events:", eventsError);
            events = [];
          } else {
            events = adminEvents || [];
            console.log("EVENT_ADMIN events result:", {
              assignedEvents: events.length,
              eventIds: events.map((e) => e.id),
            });
          }
        }
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

    // Fetch bookings data for all events
    console.log("Fetching bookings data for events...");
    const eventsWithBookings = await Promise.all(
      events.map(async (event) => {
        try {
          // Get all bookings for this event
          const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select(
              "id, userId, tickets, status, totalAmount, createdAt, paymentId"
            )
            .eq("eventId", event.id)
            .order("createdAt", { ascending: false });

          if (bookingsError) {
            console.error(
              `Error fetching bookings for event ${event.id}:`,
              bookingsError
            );
            return {
              ...event,
              bookings: [],
              _count: {
                totalBookings: 0,
                confirmedBookings: 0,
                totalTickets: 0,
                totalRevenue: 0,
              },
            };
          }

          // Calculate statistics
          const confirmedBookings =
            bookings?.filter((b) => b.status === "CONFIRMED") || [];
          const totalTickets = confirmedBookings.reduce(
            (sum, b) => sum + (b.tickets || 0),
            0
          );
          const totalRevenue = confirmedBookings.reduce(
            (sum, b) => sum + (b.totalAmount || 0),
            0
          );

          return {
            ...event,
            bookings: bookings || [],
            _count: {
              totalBookings: bookings?.length || 0,
              confirmedBookings: confirmedBookings.length,
              totalTickets,
              totalRevenue,
            },
          };
        } catch (err) {
          console.error(
            `Exception processing bookings for event ${event.id}:`,
            err
          );
          return {
            ...event,
            bookings: [],
            _count: {
              totalBookings: 0,
              confirmedBookings: 0,
              totalTickets: 0,
              totalRevenue: 0,
            },
          };
        }
      })
    );

    console.log("Final events with bookings count:", eventsWithBookings.length);
    return NextResponse.json({ events: eventsWithBookings });
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
