import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    let query = supabase
      .from("bookings")
      .select(`
        *,
        user:users(name, email),
        event:events(title, date)
      `);

    if (eventId) {
      query = query.eq("eventId", eventId);
    }

    const { data: bookings, error } = await query
      .order("createdAt", { ascending: false });

    if (error) {
      throw error;
        createdAt: "desc",
      },
      take: 50, // Limit to 50 most recent bookings
    });

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
