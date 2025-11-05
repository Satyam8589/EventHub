const { createClient } = require("@supabase/supabase-js");

async function fixEventEndTime() {
  const supabase = createClient(
    "https://wasrwhlzzmxqwiwwxtxe.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3J3aGx6em14cXdpd3d4dHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjM0MzQsImV4cCI6MjA3NjgzOTQzNH0.WIzDWe8LIjmk21lZuVBWlFp6Dusoj5pDpF42sz1MYfk"
  );

  const eventId = "0fbb5e44-4057-4e04-8258-751ad39f30a4";

  try {
    // Get the current event
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !event) {
      console.error("Error fetching event:", error);
      return;
    }

    console.log("Current event data:");
    console.log("- Start Date:", event.date);
    console.log("- End Date:", event.end_date);
    console.log("- Time:", event.time);

    // Since you said the ending time should be 9 AM on November 5, 2025
    // Let's set the end_date to November 5, 2025 at 9:00 AM
    const endDateTime = "2025-11-05T09:00:00";

    console.log("\\nUpdating event with correct end date/time...");
    console.log("New end_date:", endDateTime);

    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({
        end_date: endDateTime,
      })
      .eq("id", eventId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating event:", updateError);
      return;
    }

    console.log("\\n✅ Event updated successfully!");
    console.log("Updated event data:");
    console.log("- Start Date:", updatedEvent.date);
    console.log("- End Date:", updatedEvent.end_date);
    console.log("- Time:", updatedEvent.time);

    // Test the new status
    const now = new Date();
    const eventStartDate = new Date(updatedEvent.date);
    const eventEndDateTime = new Date(updatedEvent.end_date);

    const isUpcoming = now < eventStartDate;
    const isOngoing = now >= eventStartDate && now <= eventEndDateTime;
    const isPast = now > eventEndDateTime;

    console.log("\\n📅 NEW EVENT STATUS:");
    console.log("Current time:", now.toLocaleString());
    console.log("Event ends:", eventEndDateTime.toLocaleString());
    console.log(
      "Status:",
      isUpcoming ? "UPCOMING" : isOngoing ? "ONGOING" : "PAST"
    );
    console.log(
      "Section:",
      isPast ? "Past Events" : isOngoing ? "Ongoing Events" : "Upcoming Events"
    );

    if (isOngoing) {
      const timeToEnd = eventEndDateTime - now;
      console.log(
        "⏰ Ends in:",
        Math.round(timeToEnd / (1000 * 60)),
        "minutes"
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

fixEventEndTime();
