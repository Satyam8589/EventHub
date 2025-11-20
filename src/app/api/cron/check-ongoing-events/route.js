import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { triggerNotification, NOTIFICATION_EVENTS } from "@/lib/pusher";

// This endpoint checks for events that should be marked as ONGOING
// and triggers notifications for them
export async function GET(request) {
  try {
    // Optional: Add authentication/authorization check here
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Verify cron secret if set (for security)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Get all UPCOMING events
    const { data: upcomingEvents, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("status", "UPCOMING");

    if (fetchError) {
      throw fetchError;
    }

    const updatedEvents = [];

    for (const event of upcomingEvents || []) {
      const eventStartDate = new Date(event.date);
      const eventEndDate = event.enddate ? new Date(event.enddate) : null;

      // Check if event should be ONGOING
      // Event is ongoing if current time is between start and end (or just started if no end date)
      const shouldBeOngoing = eventStartDate <= now && (!eventEndDate || eventEndDate >= now);

      if (shouldBeOngoing) {
        // Update event status to ONGOING
        const { data: updatedEvent, error: updateError } = await supabase
          .from("events")
          .update({ status: "ONGOING" })
          .eq("id", event.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Failed to update event ${event.id}:`, updateError);
          continue;
        }

        updatedEvents.push(updatedEvent);

        // Trigger real-time notification
        await triggerNotification("events", NOTIFICATION_EVENTS.EVENT_ONGOING, {
          eventId: updatedEvent.id,
          eventTitle: updatedEvent.title,
          eventDate: updatedEvent.date,
          eventLocation: updatedEvent.location,
          eventVenue: updatedEvent.venue,
        });

        console.log(`Event ${event.title} is now ONGOING`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${upcomingEvents?.length || 0} events, updated ${updatedEvents.length} to ONGOING`,
      updatedEvents: updatedEvents.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
      })),
    });
  } catch (error) {
    console.error("Error in check-ongoing-events:", error);
    return NextResponse.json(
      { error: "Failed to check ongoing events", details: error.message },
      { status: 500 }
    );
  }
}
