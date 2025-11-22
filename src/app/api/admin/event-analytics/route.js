import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError) {
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
      .eq("eventId", eventId)
      .order("createdAt", { ascending: false });

    if (bookingsError) {
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
      return sum + (Number.parseFloat(booking.totalAmount) || 0);
    }, 0);

    const totalTickets = confirmedBookings.reduce((sum, booking) => {
      return sum + (Number.parseInt(booking.tickets) || 0);
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
        (revenueByDate[date] || 0) +
        Number.parseFloat(booking.totalAmount || 0);
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
      amount: booking.totalAmount,
      ticketCount: booking.tickets,
      status: booking.status,
      paymentId: booking.paymentId,
      createdAt: booking.createdAt,
    }));

    // Helper to ensure UTC format
    const ensureUTCString = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr.includes('T') && dateStr.endsWith('Z')) return dateStr;
      if (dateStr.includes('T')) return dateStr + 'Z';
      return dateStr.replace(' ', 'T') + 'Z';
    };

    const analytics = {
      event: {
        id: event.id,
        name: event.name || event.title,
        description: event.description,
        price: event.price,
        capacity: event.capacity,
        startDate: ensureUTCString(event.date), // Proper UTC ISO format
        endDate: ensureUTCString(event.enddate || event.endDate), // Proper UTC ISO format
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
    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
