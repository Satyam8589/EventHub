import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/leaderboard - Get all events (including expired) for leaderboard
export async function GET() {
  try {
    console.log("=== LEADERBOARD API ===");
    console.log("Starting GET /api/leaderboard");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

    // First get all events
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: false }); // Most recent first

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    console.log("Raw events from database:", events?.length || 0);
    console.log(
      "Events details:",
      events?.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        featured: e.featured,
        date: e.date,
        endDate: e.endDate,
      }))
    );

    // Filter out only cancelled events - show ALL others (including expired)
    const eventsToReturn = events.filter((event) => {
      // Skip events with CANCELLED status
      return event.status !== "CANCELLED";
    });

    console.log(
      `Leaderboard events: ${eventsToReturn.length} out of ${events.length} total (filtering out only CANCELLED events)`
    );
    console.log(
      "Leaderboard events:",
      eventsToReturn.map((e) => ({
        id: e.id,
        title: e.title,
        featured: e.featured,
        date: e.date,
        endDate: e.endDate,
        status: e.status,
      }))
    );

    // Get booking counts for each event
    const eventsWithCounts = await Promise.all(
      eventsToReturn.map(async (event) => {
        try {
          const { count, error: countError } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("eventId", event.id);

          if (countError) {
            console.error(
              `Error counting bookings for event ${event.id}:`,
              countError
            );
          }

          return {
            ...event,
            _count: {
              bookings: count || 0,
            },
          };
        } catch (error) {
          console.error(`Error processing event ${event.id}:`, error.message);
          return {
            ...event,
            _count: {
              bookings: 0,
            },
          };
        }
      })
    );

    console.log(
      "Successfully fetched leaderboard events:",
      eventsWithCounts.length
    );
    console.log(
      "Leaderboard events data:",
      eventsWithCounts.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        status: e.status,
        bookings: e._count?.bookings || 0,
      }))
    );

    const response = NextResponse.json({ events: eventsWithCounts });
    // Prevent caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (error) {
    console.error("Error fetching leaderboard events:", error.message);
    console.error("Error code:", error.code);
    console.error("Error details:", error.details);
    console.error("Error hint:", error.hint);
    console.error("Full error object:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch events",
        details: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
