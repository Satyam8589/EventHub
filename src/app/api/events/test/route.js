import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/events/test - Simple test endpoint without bookings
export async function GET() {
  try {
    console.log("Test endpoint: Fetching events directly");

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    console.log("Total events found:", events?.length);

    return NextResponse.json({
      success: true,
      totalEvents: events?.length || 0,
      events: events || [],
      message: "Direct database query - no bookings processing",
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
