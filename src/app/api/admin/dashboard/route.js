import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get user and check admin role
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "EVENT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch real admin dashboard data
    try {
      let eventsQuery = supabase.from("events").select("*");

      // If EVENT_ADMIN, only show their events
      if (user.role === "EVENT_ADMIN") {
        eventsQuery = eventsQuery.eq("organizerId", userId);
      }

      const { data: events, error: eventsError } = await eventsQuery;

      if (eventsError) {
        console.error("Error fetching events:", eventsError);
      }

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*");

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
      }

      // Calculate stats
      const totalEvents = events?.length || 0;
      const totalBookings = bookings?.length || 0;
      const totalRevenue =
        bookings?.reduce(
          (sum, booking) => sum + (booking.totalAmount || 0),
          0
        ) || 0;
      const activeEvents =
        events?.filter((event) => event.status === "UPCOMING").length || 0;

      // Get recent activity
      const recentActivity = (bookings || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map((booking) => {
          const event = events?.find((e) => e.id === booking.eventId);
          return {
            id: booking.id,
            type: "booking",
            message: `${booking.tickets} ticket(s) booked for ${
              event?.title || "Unknown Event"
            } - $${booking.totalAmount}`,
            createdAt: booking.createdAt,
          };
        });

      return NextResponse.json({
        stats: {
          totalEvents,
          totalBookings,
          totalRevenue,
          activeEvents,
        },
        recentActivity,
        events: events || [], // Include events list for admin panel
      });
    } catch (statsError) {
      console.error("Error fetching admin stats:", statsError);
      return NextResponse.json({
        stats: {
          totalEvents: 0,
          totalBookings: 0,
          totalRevenue: 0,
          activeEvents: 0,
        },
        recentActivity: [],
        events: [],
      });
    }
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
