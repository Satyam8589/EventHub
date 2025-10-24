import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    console.log("=== ADMIN DASHBOARD API CALLED ===");
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    console.log("Dashboard requested by userId:", userId);

    if (!userId) {
      console.log("ERROR: No user ID provided");
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get user and check admin role
    console.log("Fetching user data for userId:", userId);
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.log("ERROR fetching user:", userError);
    }
    
    console.log("User found:", user ? `${user.name} (${user.role})` : "No user");

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "EVENT_ADMIN")) {
      console.log("UNAUTHORIZED: User not found or invalid role");
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
      } else {
        console.log("Dashboard events fetched:", events?.length || 0, "events");
      }

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*");

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
      } else {
        console.log("Dashboard bookings fetched:", bookings?.length || 0, "bookings");
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
