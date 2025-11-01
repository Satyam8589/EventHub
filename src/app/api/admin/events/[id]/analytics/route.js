import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    console.log("=== FETCHING EVENT ANALYTICS ===");
    console.log("Event ID:", id);

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError) {
      console.error("Error fetching event:", eventError);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get bookings for this event with user details
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        user:users(*)
      `
      )
      .eq("eventId", id)
      .order("createdAt", { ascending: false });

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    // Calculate analytics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");
    const pendingBookings = bookings.filter((b) => b.status === "PENDING");
    const failedBookings = bookings.filter((b) => b.status === "FAILED");

    const totalRevenue = confirmedBookings.reduce((sum, booking) => {
      return sum + (parseFloat(booking.amount) || 0);
    }, 0);

    const totalTickets = confirmedBookings.reduce((sum, booking) => {
      return sum + (booking.ticketCount || 0);
    }, 0);

    // Get unique attendees (users who have confirmed bookings)
    const uniqueAttendees = new Set(
      confirmedBookings.map((booking) => booking.userId)
    ).size;

    // Revenue by date (for chart)
    const revenueByDate = {};
    confirmedBookings.forEach((booking) => {
      const date = new Date(booking.createdAt).toISOString().split("T")[0];
      revenueByDate[date] =
        (revenueByDate[date] || 0) + parseFloat(booking.amount || 0);
    });

    // Bookings by status
    const bookingsByStatus = {
      CONFIRMED: confirmedBookings.length,
      PENDING: pendingBookings.length,
      FAILED: failedBookings.length,
    };

    // Recent bookings (last 10)
    const recentBookings = bookings.slice(0, 10).map((booking) => ({
      id: booking.id,
      userName: booking.user?.name || "Unknown",
      userEmail: booking.user?.email || "Unknown",
      userPhone: booking.user?.phone || "Not provided",
      amount: booking.amount,
      ticketCount: booking.ticketCount,
      status: booking.status,
      createdAt: booking.createdAt,
    }));

    const analytics = {
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        price: event.price,
        capacity: event.capacity,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        createdAt: event.createdAt,
      },
      summary: {
        totalBookings,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: pendingBookings.length,
        failedBookings: failedBookings.length,
        totalRevenue,
        totalTickets,
        uniqueAttendees,
        capacityUsed: event.capacity
          ? Math.round((totalTickets / event.capacity) * 100)
          : 0,
      },
      charts: {
        revenueByDate,
        bookingsByStatus,
      },
      recentBookings,
      allBookings: bookings.length <= 100 ? bookings : bookings.slice(0, 100), // Limit to 100 for performance
    };

    console.log("Analytics generated successfully");
    console.log("Summary:", analytics.summary);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error in analytics API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
