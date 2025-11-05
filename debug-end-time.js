const { createClient } = require("@supabase/supabase-js");

async function debugEndTimeIssue() {
  const supabase = createClient(
    "https://wasrwhlzzmxqwiwwxtxe.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3J3aGx6em14cXdpd3d4dHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjM0MzQsImV4cCI6MjA3NjgzOTQzNH0.WIzDWe8LIjmk21lZuVBWlFp6Dusoj5pDpF42sz1MYfk"
  );

  const eventId = "0fbb5e44-4057-4e04-8258-751ad39f30a4";

  try {
    // Get the event
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      return;
    }

    if (!event) {
      console.log("Event not found");
      return;
    }

    console.log("=".repeat(80));
    console.log("END TIME DEBUG - EVENT DETAILS");
    console.log("=".repeat(80));
    console.log("Event ID:", event.id);
    console.log("Title:", event.title);
    console.log("Start Date (Raw):", event.date);
    console.log("End Date (Raw):", event.end_date);
    console.log("Time (Raw):", event.time);
    console.log("End Time (Raw):", event.end_time);

    // Current time
    const now = new Date();
    console.log("\\nCurrent Time:", now.toLocaleString());
    console.log("Current Time ISO:", now.toISOString());

    // Parse dates (same logic as my-events page)
    const eventStartDate = new Date(event.date);
    console.log("\\nParsed Start Date:", eventStartDate.toLocaleString());
    console.log("Parsed Start Date ISO:", eventStartDate.toISOString());

    // Calculate end date/time (exact same logic as my-events page)
    let eventEndDateTime;

    console.log("\\n" + "=".repeat(80));
    console.log("END DATE/TIME CALCULATION LOGIC");
    console.log("=".repeat(80));

    if (event.end_date) {
      console.log("✅ Event has end_date field");
      eventEndDateTime = new Date(event.end_date);
      console.log("Using end_date:", event.end_date);
      console.log("Parsed End DateTime:", eventEndDateTime.toLocaleString());
      console.log("Parsed End DateTime ISO:", eventEndDateTime.toISOString());
    } else {
      console.log("❌ No end_date field, calculating from start date + time");

      if (event.time) {
        console.log("✅ Event has time field:", event.time);
        const combinedDateTime = `${event.date}T${event.time}`;
        console.log("Combining date + time:", combinedDateTime);
        eventEndDateTime = new Date(combinedDateTime);

        if (isNaN(eventEndDateTime.getTime())) {
          console.log(
            "❌ Invalid date/time combination, falling back to end of day"
          );
          eventEndDateTime = new Date(eventStartDate);
          eventEndDateTime.setHours(23, 59, 59, 999);
        } else {
          console.log("✅ Valid combined date/time");
        }
      } else {
        console.log("❌ No time field, using end of day");
        eventEndDateTime = new Date(eventStartDate);
        eventEndDateTime.setHours(23, 59, 59, 999);
      }

      console.log(
        "Calculated End DateTime:",
        eventEndDateTime.toLocaleString()
      );
      console.log(
        "Calculated End DateTime ISO:",
        eventEndDateTime.toISOString()
      );
    }

    // Status calculation
    console.log("\\n" + "=".repeat(80));
    console.log("EVENT STATUS CALCULATION");
    console.log("=".repeat(80));

    const isUpcoming = now < eventStartDate;
    const isOngoing = now >= eventStartDate && now <= eventEndDateTime;
    const isPast = now > eventEndDateTime;

    console.log("Now:", now.toISOString());
    console.log("Start:", eventStartDate.toISOString());
    console.log("End:", eventEndDateTime.toISOString());
    console.log("");
    console.log("now < start (isUpcoming):", isUpcoming);
    console.log("start <= now <= end (isOngoing):", isOngoing);
    console.log("now > end (isPast):", isPast);

    console.log("\\n" + "=".repeat(80));
    console.log("RESULT");
    console.log("=".repeat(80));

    if (isUpcoming) {
      console.log("📅 EVENT STATUS: UPCOMING");
      console.log("📁 SECTION: Upcoming Events");
      const timeToStart = eventStartDate - now;
      console.log(
        "⏰ STARTS IN:",
        Math.round(timeToStart / (1000 * 60)),
        "minutes"
      );
    } else if (isOngoing) {
      console.log("▶️ EVENT STATUS: ONGOING");
      console.log("📁 SECTION: Ongoing Events");
      const timeToEnd = eventEndDateTime - now;
      console.log(
        "⏰ ENDS IN:",
        Math.round(timeToEnd / (1000 * 60)),
        "minutes"
      );
    } else {
      console.log("✅ EVENT STATUS: PAST");
      console.log("📁 SECTION: Past Events");
      const timeSinceEnd = now - eventEndDateTime;
      console.log(
        "⏰ ENDED:",
        Math.round(timeSinceEnd / (1000 * 60)),
        "minutes ago"
      );
    }

    // Check if user's expectation (9 AM end time) matches
    console.log("\\n" + "=".repeat(80));
    console.log("USER EXPECTATION CHECK");
    console.log("=".repeat(80));
    console.log("User said ending time is 9 AM");
    console.log("Current time is 6:20 AM");
    console.log("Expected: Event should be ONGOING (not past)");
    console.log(
      "Actual:",
      isPast ? "PAST (❌ PROBLEM!)" : "ONGOING (✅ CORRECT)"
    );

    if (isPast) {
      console.log("\\n🚨 PROBLEM DETECTED:");
      console.log("Event is showing as PAST when it should be ONGOING");
      console.log("Calculated end time:", eventEndDateTime.toLocaleString());
      console.log(
        "This suggests the end time is not being stored/calculated correctly"
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

debugEndTimeIssue();
