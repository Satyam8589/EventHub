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
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", adminUserId)
        .single();
      if (user?.role === "EVENT_ADMIN") {
        // Event Admin - get only events they are assigned to via junction table
        // First get the event assignments
        const { data: assignments, error: assignmentError } = await supabase
          .from("event_admins")
          .select("event_id, user_id")
          .eq("user_id", adminUserId);
        if (assignmentError) {
          events = [];
        } else if (!assignments || assignments.length === 0) {
          events = [];
        } else {
          // Get the actual events
          const eventIds = assignments.map((a) => a.event_id);
          const { data: adminEvents, error: eventsError } = await supabase
            .from("events")
            .select("*")
            .in("id", eventIds);

          if (eventsError) {
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
        const { data: allEvents, error: allEventsError } = await supabase
          .from("events")
          .select("*");
        events = allEvents || [];
      }
    } else {
      // No admin user ID provided - get all events
      const { data: allEvents, error: allEventsError } = await supabase
        .from("events")
        .select("*")
        .order("createdAt", { ascending: false });
      events = allEvents || [];
    }

    // Fetch bookings data for all events
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
    return NextResponse.json({ events: eventsWithBookings });
  } catch (error) {
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
      endTime,
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

    const [y, m, d] = (date || "").split("-").map(Number);
    const [hh, mm] = (time || "00:00").split(":").map(Number);
    const eventDateISO = new Date(Date.UTC(y, (m || 1) - 1, d || 1, (hh || 0) - 5, (mm || 0) - 30)).toISOString();

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
          date: eventDateISO,
          time,
          endtime: endTime || null, // Use lowercase to match PostgreSQL column name
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

    // If endTime column doesn't exist, retry without endTime
    if (
      createError &&
      createError.code === "PGRST204" &&
      (createError.message.includes("endTime") ||
        createError.message.includes("endtime"))
    ) {
      const { data: retryEvent, error: retryCreateError } = await supabase
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

      if (retryCreateError) {
        console.error("Error creating event (retry):", retryCreateError);
        return NextResponse.json(
          { error: "Failed to create event" },
          { status: 500 }
        );
      }

      return NextResponse.json({ event: retryEvent });
    }

    if (createError) {
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
