import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/debug/event-price/[id] - Debug event price data
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Get raw event data from database
    const { data: event, error } = await supabase
      .from("events")
      .select("id, title, price, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      event,
      price_info: {
        raw_price: event.price,
        price_type: typeof event.price,
        price_string: String(event.price),
        parseFloat_price: parseFloat(event.price),
        parseFloat_or_zero: parseFloat(event.price) || 0,
        is_exact_0_99: event.price === 0.99,
        price_formatted: Number(event.price).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error fetching event price debug info:", error);
    return NextResponse.json(
      { error: "Failed to fetch event price debug info" },
      { status: 500 }
    );
  }
}
