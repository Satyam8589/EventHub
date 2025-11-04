import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/debug/events-filtering - Debug why events are being filtered
export async function GET() {
  try {
    console.log("=== DEBUGGING EVENTS FILTERING ===");

    // Get all events (no filtering)
    const { data: allEvents, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }

    console.log("All events from database:", allEvents?.length || 0);

    // Apply the same filtering logic as the main API
    const now = new Date();
    console.log("Current time:", now.toISOString());

    const filteringResults = allEvents.map((event) => {
      // Check endDate filtering (same as main API)
      const endDateValue = event.endDate || event.enddate;
      let passesEndDateFilter = false;
      let endDateReason = "";

      if (endDateValue) {
        const endDate = new Date(endDateValue);
        passesEndDateFilter = endDate >= now;
        endDateReason = `Has endDate: ${endDateValue}, endDate >= now: ${passesEndDateFilter}`;
      } else {
        // If no endDate, use the start date
        const eventDate = new Date(event.date);
        passesEndDateFilter = eventDate >= now;
        endDateReason = `No endDate, using event date: ${event.date}, eventDate >= now: ${passesEndDateFilter}`;
      }

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        endDate: event.endDate || event.enddate,
        status: event.status,
        passesFilter: passesEndDateFilter,
        reason: endDateReason,
        dateCheck: {
          eventDate: event.date,
          endDate: endDateValue,
          currentTime: now.toISOString(),
          eventDateParsed: new Date(event.date).toISOString(),
          endDateParsed: endDateValue
            ? new Date(endDateValue).toISOString()
            : null,
        },
      };
    });

    const activeEvents = filteringResults.filter((e) => e.passesFilter);

    return NextResponse.json({
      currentTime: now.toISOString(),
      totalEvents: allEvents.length,
      activeEvents: activeEvents.length,
      filteredOut: allEvents.length - activeEvents.length,
      filteringDetails: filteringResults,
      summary: {
        allEvents: allEvents.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          endDate: e.endDate || e.enddate,
          status: e.status,
        })),
        activeEvents: activeEvents.map((e) => ({
          id: e.id,
          title: e.title,
          passesFilter: e.passesFilter,
        })),
      },
    });
  } catch (error) {
    console.error("Error debugging events filtering:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
