import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/events/organizers - Get organizer assignment status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkOrganizer = searchParams.get("organizerId");

    console.log("=== CHECKING ORGANIZER ASSIGNMENTS ===");

    if (checkOrganizer) {
      // Check if a specific organizer is already assigned
      console.log("Checking organizer:", checkOrganizer);

      const { data: events, error } = await supabase
        .from("events")
        .select("id, title, organizerId, organizerName, organizerEmail")
        .eq("organizerId", checkOrganizer);

      if (error) {
        console.error("Error checking organizer:", error);
        throw error;
      }

      const isAssigned = events && events.length > 0;

      return NextResponse.json({
        organizerId: checkOrganizer,
        isAssigned,
        assignedEvents: events || [],
        message: isAssigned
          ? `This organizer is already assigned to ${events.length} event(s)`
          : "This organizer is available",
      });
    } else {
      // Get all organizers and their assignment status
      const { data: allEvents, error } = await supabase
        .from("events")
        .select("id, title, organizerId, organizerName, organizerEmail");

      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }

      // Group events by organizer
      const organizerMap = {};
      allEvents?.forEach((event) => {
        if (event.organizerId) {
          if (!organizerMap[event.organizerId]) {
            organizerMap[event.organizerId] = {
              organizerId: event.organizerId,
              organizerName: event.organizerName,
              organizerEmail: event.organizerEmail,
              assignedEvents: [],
            };
          }
          organizerMap[event.organizerId].assignedEvents.push({
            id: event.id,
            title: event.title,
          });
        }
      });

      const organizers = Object.values(organizerMap);

      return NextResponse.json({
        totalOrganizers: organizers.length,
        organizers,
        message: `Found ${organizers.length} organizer(s) managing events`,
      });
    }
  } catch (error) {
    console.error("Error in organizers API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch organizer information",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
