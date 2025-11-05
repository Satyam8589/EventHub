const { createClient } = require("@supabase/supabase-js");

async function fixEventData() {
  const supabase = createClient(
    "https://wasrwhlzzmxqwiwwxtxe.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3J3aGx6em14cXdpd3d4dHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjM0MzQsImV4cCI6MjA3NjgzOTQzNH0.WIzDWe8LIjmk21lZuVBWlFp6Dusoj5pDpF42sz1MYfk"
  );

  const eventId = "0fbb5e44-4057-4e04-8258-751ad39f30a4";

  try {
    // The correct end date/time should be November 5, 2025 at 9:00 AM
    // Based on: enddate = 2025-11-05 (date part) + endtime = 09:00:00
    const correctEndDateTime = "2025-11-05T09:00:00";

    console.log("Updating event with correct combined end date/time...");
    console.log("Setting enddate to:", correctEndDateTime);

    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update({
        enddate: correctEndDateTime,
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
    console.log("- date:", updatedEvent.date);
    console.log("- time:", updatedEvent.time);
    console.log("- enddate:", updatedEvent.enddate);
    console.log("- endtime:", updatedEvent.endtime);

    // Test the new status
    const now = new Date();
    const eventStartDate = new Date(updatedEvent.date);
    const eventEndDateTime = new Date(updatedEvent.enddate);

    const isUpcoming = now < eventStartDate;
    const isOngoing = now >= eventStartDate && now <= eventEndDateTime;
    const isPast = now > eventEndDateTime;

    console.log("\\n📅 NEW EVENT STATUS:");
    console.log("Current time:", now.toLocaleString());
    console.log("Event starts:", eventStartDate.toLocaleString());
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

fixEventData();
