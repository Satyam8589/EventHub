import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/bookings - Get all bookings (with optional user filter)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status"); // Optional status filter
    // First get the bookings
    let query = supabase
      .from("bookings")
      .select("*")
      .order("createdAt", { ascending: false });

    if (userId) {
      query = query.eq("userId", userId);
    }

    // Filter by status if provided (e.g., "CONFIRMED", "PENDING", "FAILED" or "CONFIRMED,COMPLETED")
    if (status) {
      if (status.includes(",")) {
        // Handle multiple statuses
        const statusArray = status.split(",").map((s) => s.trim());
        query = query.in("status", statusArray);
      } else {
        // Handle single status
        query = query.eq("status", status);
      }
    }

    const { data: bookings, error } = await query;

    if (error) {
      throw error;
    }
    console.log(
      "Booking statuses:",
      bookings?.map((b) => ({
        id: b.id,
        status: b.status,
        userId: b.userId,
        eventId: b.eventId,
      }))
    );

    if (!bookings || bookings.length === 0) {
      console.log(
        "Check: 1) userId exists in database, 2) bookings exist for this user, 3) status matches filter"
      );

      // Return empty array if no bookings found
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
        // Fetch event details
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", booking.eventId)
          .single();

        // Fetch user details
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, name, email, phone, avatar")
          .eq("id", booking.userId)
          .single();

        if (eventError) {
        }

        if (userError) {
        }

        return {
          ...booking,
          event: event || null,
          user: user || null,
        };
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
    return NextResponse.json(
      {
        error: "Failed to fetch bookings",
        details: error?.message || "Unknown error",
        bookings: [], // Return empty array to prevent frontend crash
      },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request) {
  try {
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
          status: "CONFIRMED", // For now, we'll auto-confirm bookings
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
      updateData.updatedAt = new Date().toISOString();
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
