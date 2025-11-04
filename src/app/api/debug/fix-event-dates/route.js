import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/debug/fix-event-dates - Update existing events to future dates
export async function POST() {
  try {
    console.log("Fixing event dates to be in the future...");

    // Get all events
    const { data: events, error: fetchError } = await supabase
      .from("events")
      .select("id, title, date");

    if (fetchError) {
      throw fetchError;
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No events found to update",
      });
    }

    console.log("Found events to update:", events);

    // Update each event to have a future date
    const updatePromises = events.map(async (event, index) => {
      const futureDays = 7 + index; // 7, 8, 9 days from now
      const futureDate = new Date(
        Date.now() + futureDays * 24 * 60 * 60 * 1000
      );

      const { data: updatedEvent, error: updateError } = await supabase
        .from("events")
        .update({
          date: futureDate.toISOString(),
          status: "UPCOMING",
        })
        .eq("id", event.id)
        .select("id, title, date")
        .single();

      if (updateError) {
        console.error(`Error updating event ${event.id}:`, updateError);
        return { id: event.id, success: false, error: updateError.message };
      }

      return {
        id: event.id,
        success: true,
        old_date: event.date,
        new_date: updatedEvent.date,
      };
    });

    const results = await Promise.all(updatePromises);

    console.log("Update results:", results);

    return NextResponse.json({
      success: true,
      message: `Updated ${
        results.filter((r) => r.success).length
      } events to future dates`,
      results: results,
    });
  } catch (error) {
    console.error("Failed to fix event dates:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
