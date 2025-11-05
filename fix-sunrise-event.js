// Quick fix to check and update the "Sunrise to Sunset Music Fest" event
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xscrcrdnkyxdtwwwhfec.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY3JjcmRua3l4ZHR3d3doZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MTUwMTYsImV4cCI6MjA0NjI5MTAxNn0.GcdLhxoA2G2SKKoWY3wlKzqRuNP-Q18aNz6Py5wHx_k";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSunriseEvent() {
  console.log("🔧 FIXING SUNRISE TO SUNSET MUSIC FEST EVENT");
  console.log("===========================================\n");

  try {
    // Find the event by title
    const { data: events, error: eventError } = await supabase
      .from("events")
      .select("*")
      .ilike("title", "%Sunrise to Sunset%");

    if (eventError) {
      console.error("❌ Error finding event:", eventError);
      return;
    }

    if (!events || events.length === 0) {
      console.log("❌ No 'Sunrise to Sunset' events found");
      return;
    }

    const event = events[0];
    console.log("🎯 FOUND EVENT:");
    console.log("- ID:", event.id);
    console.log("- Title:", event.title);
    console.log("- Date:", event.date);
    console.log("- End Date:", event.endDate);
    console.log("- End date (lowercase):", event.enddate);

    // Check if it's missing end date
    if (!event.endDate && !event.enddate) {
      console.log(
        "❌ Missing end date! This explains the single-day detection."
      );

      // Since we know from scanned QRs it's a 2-day event (Day 1 and Day 2 were scanned)
      // Let's set the end date to one day after start date
      const startDate = new Date(event.date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1); // Make it 2-day event

      console.log(
        "🔧 FIXING: Setting end date to:",
        endDate.toISOString().split("T")[0]
      );

      const { error: updateError } = await supabase
        .from("events")
        .update({
          endDate: endDate.toISOString().split("T")[0],
        })
        .eq("id", event.id);

      if (updateError) {
        console.error("❌ Failed to update:", updateError);
      } else {
        console.log("✅ Event updated successfully!");
        console.log("✅ Event is now properly set as 2-day event");
      }
    } else {
      console.log("✅ Event already has end date");
    }
  } catch (error) {
    console.error("❌ Fix failed:", error);
  }
}

fixSunriseEvent();
