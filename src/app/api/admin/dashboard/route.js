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
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
    }

    console.log(
      "User found:",
      user ? `${user.name} (${user.role})` : "No user"
    );

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
      } else {
      }

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*");

      if (bookingsError) {
      } else {
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

      // Get recent activity - combine bookings and events
      const recentActivity = [];

      // Add recent bookings
      (bookings || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8)
        .forEach((booking) => {
          const event = events?.find((e) => e.id === booking.eventId);
          recentActivity.push({
            id: `booking-${booking.id}`,
            type: "booking",
            description: `${booking.tickets} ticket(s) booked for ${
              event?.title || "Unknown Event"
            } - â‚¹${booking.totalAmount?.toLocaleString("en-IN")}`,
            timestamp: new Date(booking.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            createdAt: booking.createdAt,
          });
        });

      // Add recent events
      (events || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .forEach((event) => {
          recentActivity.push({
            id: `event-${event.id}`,
            type: "event",
            description: `New event created: ${event.title}`,
            timestamp: new Date(event.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
            createdAt: event.createdAt,
          });
        });

      // Sort all activities by creation date and limit to 10
      recentActivity.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const finalRecentActivity = recentActivity.slice(0, 10);

      return NextResponse.json({
        stats: {
          totalEvents,
          totalBookings,
          totalRevenue,
          activeEvents,
        },
        recentActivity: finalRecentActivity,
        events: events || [], // Include events list for admin panel
      });
    } catch (statsError) {
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
