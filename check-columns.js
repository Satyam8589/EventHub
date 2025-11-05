const { createClient } = require("@supabase/supabase-js");

async function checkEventColumns() {
  const supabase = createClient(
    "https://wasrwhlzzmxqwiwwxtxe.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3J3aGx6em14cXdpd3d4dHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjM0MzQsImV4cCI6MjA3NjgzOTQzNH0.WIzDWe8LIjmk21lZuVBWlFp6Dusoj5pDpF42sz1MYfk"
  );

  try {
    // Get a sample event to see all available columns
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error fetching events:", error);
      return;
    }

    if (events.length > 0) {
      console.log("Available columns in events table:");
      console.log(Object.keys(events[0]));
      console.log("\\nSample event data:");
      console.log(JSON.stringify(events[0], null, 2));
    } else {
      console.log("No events found");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkEventColumns();
