import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/debug/db-health - Check database connection and table status
export async function GET() {
  try {
    console.log("Starting database health check...");

    // Test 1: Basic connection test - count events
    const { count: eventsCount, error: connectionError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    console.log("Connection test result:", { eventsCount, connectionError });

    // Test 2: Try to get sample data from events table
    const { data: sampleEvents, error: sampleError } = await supabase
      .from("events")
      .select("id, title, price, date, status")
      .limit(3);

    console.log("Sample events query:", { sampleEvents, sampleError });

    // Test 3: Check other tables
    const { count: usersCount, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: bookingsCount, error: bookingsError } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });

    // Prepare response
    const healthStatus = {
      database_connection: !connectionError,
      events_table_accessible: !connectionError,
      events_count: eventsCount || 0,
      sample_events: sampleEvents || [],
      users_table_accessible: !usersError,
      users_count: usersCount || 0,
      bookings_table_accessible: !bookingsError,
      bookings_count: bookingsCount || 0,
      errors: {
        connection_error: connectionError?.message || null,
        sample_error: sampleError?.message || null,
        users_error: usersError?.message || null,
        bookings_error: bookingsError?.message || null,
      },
      supabase_config: {
        url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url_preview:
          process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      },
    };

    console.log("Health status:", healthStatus);

    return NextResponse.json({
      status: healthStatus.database_connection ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      details: healthStatus,
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
