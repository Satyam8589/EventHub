import { NextResponse } from "next/server";
import { supabase, getSupabaseAdmin } from "@/lib/supabase";

// GET /api/bookings - Get all bookings (with optional user filter)
export async function GET(request) {
  try {
    const dbClient = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status"); // Optional status filter

    // First get the bookings
    let query = dbClient.from("bookings").select("*");

    if (userId) {
      query = query.eq("userId", userId);
    }

    // Sanitize status filter against valid PostgreSQL BookingStatus enum values
    const VALID_BOOKING_STATUSES = ["CONFIRMED", "PENDING", "CANCELLED", "FAILED"];
    let validStatuses = null;
    if (status) {
      const rawStatuses = status.split(",").map((s) => s.trim().toUpperCase());
      const filtered = rawStatuses.filter((s) => VALID_BOOKING_STATUSES.includes(s));
      if (filtered.length > 0) {
        validStatuses = filtered;
      }
    }

    if (validStatuses) {
      if (validStatuses.length === 1) {
        query = query.eq("status", validStatuses[0]);
      } else {
        query = query.in("status", validStatuses);
      }
    }

    let { data: bookings, error } = await query.order("createdAt", { ascending: false });

    // Fallback if createdAt column name differs (e.g. created_at)
    if (error && (error.message?.includes("createdAt") || error.code === "PGRST204" || error.code === "42703")) {
      console.warn("Retrying bookings query with created_at order:", error.message);
      let retryQuery = dbClient.from("bookings").select("*");
      if (userId) retryQuery = retryQuery.eq("userId", userId);
      if (validStatuses) {
        if (validStatuses.length === 1) {
          retryQuery = retryQuery.eq("status", validStatuses[0]);
        } else {
          retryQuery = retryQuery.in("status", validStatuses);
        }
      }
      const retryRes = await retryQuery.order("created_at", { ascending: false });
      if (!retryRes.error) {
        bookings = retryRes.data;
        error = null;
      } else {
        // Retry without order
        let noOrderQuery = dbClient.from("bookings").select("*");
        if (userId) noOrderQuery = noOrderQuery.eq("userId", userId);
        if (validStatuses) {
          if (validStatuses.length === 1) {
            noOrderQuery = noOrderQuery.eq("status", validStatuses[0]);
          } else {
            noOrderQuery = noOrderQuery.in("status", validStatuses);
          }
        }
        const noOrderRes = await noOrderQuery;
        if (!noOrderRes.error) {
          bookings = noOrderRes.data;
          error = null;
        }
      }
    }

    if (error) {
      console.error("❌ Error fetching bookings from Supabase:", error);
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json(
        { bookings: [] },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // Then fetch event and user details for each booking
    const bookingsWithEventAndUser = await Promise.all(
      bookings.map(async (booking) => {
        try {
          const eventIdToQuery = booking.eventId || booking.eventid || booking.event_id;
          const userIdToQuery = booking.userId || booking.userid || booking.user_id;

          const { data: event } = await dbClient
            .from("events")
            .select("*")
            .eq("id", eventIdToQuery)
            .maybeSingle();

          const { data: user } = await dbClient
            .from("users")
            .select("id, name, email, phone, avatar")
            .eq("id", userIdToQuery)
            .maybeSingle();

          return {
            ...booking,
            event: event || null,
            user: user || null,
          };
        } catch (joinErr) {
          console.warn("Error resolving booking event/user join:", joinErr);
          return {
            ...booking,
            event: null,
            user: null,
          };
        }
      })
    );

    return NextResponse.json(
      { bookings: bookingsWithEventAndUser },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("❌ Critical error in GET /api/bookings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch bookings",
        details: error?.message || "Unknown error",
        bookings: [],
      },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request) {
  try {
    const now = new Date();
    const datePart = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const timePart = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
    const nowIstIso = `${datePart}T${timePart}+05:30`;
    const body = await request.json();
    const {
      userId,
      eventId,
      tickets,
      totalAmount,
      paymentMethod,
      userDetails,
    } = body;

    // Validate required fields
    if (!userId || !eventId || !tickets || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if event exists and has capacity
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check max tickets per user
    if (event.max_tickets_per_user && event.max_tickets_per_user > 0) {
      const { data: userBookings, error: userBookingsError } = await supabase
        .from("bookings")
        .select("tickets")
        .eq("eventId", eventId)
        .eq("userId", userId)
        .eq("status", "CONFIRMED");

      if (userBookingsError) {
        throw userBookingsError;
      }

      const userTotalTickets = userBookings.reduce(
        (sum, booking) => sum + booking.tickets,
        0
      );

      if (userTotalTickets + tickets > event.max_tickets_per_user) {
        return NextResponse.json(
          {
            error: `You can only book a maximum of ${event.max_tickets_per_user} tickets for this event.`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate current bookings
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("tickets")
      .eq("eventId", eventId)
      .in("status", ["CONFIRMED", "PENDING"]);

    if (bookingsError) {
      throw bookingsError;
    }

    const totalBookedTickets = existingBookings.reduce(
      (sum, booking) => sum + booking.tickets,
      0
    );

    if (totalBookedTickets + tickets > event.capacity) {
      return NextResponse.json(
        { error: "Not enough tickets available" },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([
        {
          id: crypto.randomUUID(), // Generate a unique ID
          userId,
          eventId,
          tickets: parseInt(tickets),
          totalAmount: parseFloat(totalAmount),
          paymentMethod,
          status: "CONFIRMED",
          createdAt: nowIstIso,
          updatedAt: nowIstIso,
        },
      ])
      .select("*")
      .single();

    if (bookingError) {
      throw bookingError;
    }

    // Update user profile with any new details provided during booking
    if (
      userDetails &&
      (userDetails.name || userDetails.phone || userDetails.phoneNumber)
    ) {
      const updateData = {};
      if (userDetails.name) updateData.name = userDetails.name;
      if (userDetails.phone) updateData.phone = userDetails.phone;
      if (userDetails.phoneNumber) updateData.phone = userDetails.phoneNumber; // Handle frontend phoneNumber field
      updateData.updatedAt = nowIstIso;
      const { error: userUpdateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (userUpdateError) {
      } else {
      }
    }

    // Fetch user details to include in response (with updated information)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
    } else {
    }

    // Return booking with user and event information for frontend
    const bookingWithDetails = {
      ...booking,
      event,
      user: user || null,
    };

    return NextResponse.json({ booking: bookingWithDetails }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
