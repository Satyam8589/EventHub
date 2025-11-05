const { createClient } = require("@supabase/supabase-js");

async function testFixedEndTimeLogic() {
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

    if (error || !event) {
      console.error("Error fetching event:", error);
      return;
    }

    console.log("=".repeat(80));
    console.log("TESTING FIXED END TIME LOGIC");
    console.log("=".repeat(80));
    console.log("Event data:");
    console.log("- enddate:", event.enddate);
    console.log("- endtime:", event.endtime);

    // Simulate the new logic
    const now = new Date();
    const eventStartDate = new Date(event.date);

    let eventEndDateTime;
    if (event.endDate || event.enddate) {
      // Event has an end date/time
      const endDateValue = event.endDate || event.enddate;

      console.log("\\nProcessing end date/time:");
      console.log("- endDateValue:", endDateValue);
      console.log("- endtime:", event.endtime);
      console.log("- endDateValue includes T?", endDateValue.includes("T"));

      // Check if we also have endtime to combine
      if (event.endtime && !endDateValue.includes("T")) {
        // If enddate doesn't include time (just date) and we have endtime, combine them
        const combinedDateTime = `${endDateValue}T${event.endtime}`;
        console.log("- Combining date + time:", combinedDateTime);
        eventEndDateTime = new Date(combinedDateTime);
      } else {
        // Use enddate as-is (already includes time)
        console.log("- Using enddate as-is");
        eventEndDateTime = new Date(endDateValue);
      }

      console.log(
        "- Final eventEndDateTime:",
        eventEndDateTime.toLocaleString()
      );
      console.log(
        "- Final eventEndDateTime ISO:",
        eventEndDateTime.toISOString()
      );
    }

    // Status calculation
    const isUpcoming = now < eventStartDate;
    const isOngoing = now >= eventStartDate && now <= eventEndDateTime;
    const isPast = now > eventEndDateTime;

    console.log("\\n" + "=".repeat(80));
    console.log("STATUS CALCULATION");
    console.log("=".repeat(80));
    console.log("Current time:", now.toLocaleString());
    console.log("Event starts:", eventStartDate.toLocaleString());
    console.log("Event ends:", eventEndDateTime.toLocaleString());
    console.log("");
    console.log("isUpcoming:", isUpcoming);
    console.log("isOngoing:", isOngoing);
    console.log("isPast:", isPast);

    console.log("\\n" + "=".repeat(80));
    console.log("RESULT");
    console.log("=".repeat(80));

    if (isUpcoming) {
      console.log("📅 EVENT STATUS: UPCOMING");
      console.log("📁 SECTION: Upcoming Events");
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
  } catch (error) {
    console.error("Error:", error);
  }
}

testFixedEndTimeLogic();
