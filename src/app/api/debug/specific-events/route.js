import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/debug/specific-events - Get detailed info about specific events
export async function GET() {
  try {
    // Get the specific events we saw in the health check
    const eventIds = [
      "8cad8d5d-b202-4e84-924c-9cbce7c6132f",
      "ea2665ce-e35b-40fc-aded-185cfdb90807",
    ];

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .in("id", eventIds);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      events: events,
      analysis: events.map((event) => ({
        id: event.id,
        title: event.title,
        price: event.price,
        price_type: typeof event.price,
        is_0_99: event.price === 0.99,
        formatted_price: Number(event.price).toFixed(2),
        created_at: event.createdAt || event.created_at,
        all_fields: Object.keys(event),
      })),
    });
  } catch (error) {
    console.error("Error fetching specific events:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
