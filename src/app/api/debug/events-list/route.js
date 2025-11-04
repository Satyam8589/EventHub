import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/debug/events-list - List all events with price info for debugging
export async function GET() {
  try {
    console.log("Fetching events list for debugging...");

    // Get all events with basic price info - simplified query
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .limit(20);

    if (error) {
      console.error("Events list error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("Raw events data:", events);

    if (!events || events.length === 0) {
      return NextResponse.json({
        total_events: 0,
        events: [],
        price_summary: {
          events_with_0_99: 0,
          unique_prices: [],
        },
        message: "No events found in database",
      });
    }

    // Process each event to add price analysis
    const eventsWithPriceInfo = events.map((event) => {
      try {
        return {
          ...event,
          price_analysis: {
            raw_price: event.price,
            price_type: typeof event.price,
            is_0_99: event.price === 0.99,
            is_numeric: !isNaN(Number(event.price)),
            formatted: Number(event.price || 0).toFixed(2),
          },
        };
      } catch (err) {
        console.error("Error processing event:", event.id, err);
        return {
          ...event,
          price_analysis: {
            raw_price: event.price,
            price_type: typeof event.price,
            is_0_99: false,
            is_numeric: false,
            formatted: "0.00",
            error: err.message,
          },
        };
      }
    });

    const uniquePrices = [
      ...new Set(
        events.map((e) => e.price).filter((p) => p !== null && p !== undefined)
      ),
    ];

    return NextResponse.json({
      total_events: events.length,
      events: eventsWithPriceInfo,
      price_summary: {
        events_with_0_99: eventsWithPriceInfo.filter((e) => e.price === 0.99)
          .length,
        unique_prices: uniquePrices.sort((a, b) => a - b),
      },
    });
  } catch (error) {
    console.error("Error fetching events list for debugging:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch events list: ${error.message}`,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
