// Test to check event endtime field in database
console.log("🔍 CHECKING EVENT ENDTIME FIELD IN DATABASE");
console.log("============================================\n");

// Import Supabase
const { createClient } = require("@supabase/supabase-js");

// Create Supabase client (you'll need to replace with your actual values)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "your-supabase-url";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-key";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventEndtime() {
  try {
    console.log("📋 Fetching events with endtime field...\n");

    // Fetch all events to see what columns exist
    const { data: events, error } = await supabase
      .from("events")
      .select("id, title, time, endtime, enddate")
      .limit(5);

    if (error) {
      console.error("❌ Error fetching events:", error);
      return;
    }

    console.log("✅ Found", events.length, "events:");
    console.log("=".repeat(50));

    events.forEach((event, index) => {
      console.log(`${index + 1}. Event: ${event.title}`);
      console.log(`   📅 ID: ${event.id}`);
      console.log(`   ⏰ Start Time: ${event.time || "Not set"}`);
      console.log(`   🏁 End Time: ${event.endtime || "Not set"}`);
      console.log(`   📅 End Date: ${event.enddate || "Not set"}`);
      console.log("");
    });

    // Check specific event (you can modify this ID)
    console.log("🔍 Checking specific event (first one)...");
    if (events.length > 0) {
      const eventId = events[0].id;
      const { data: singleEvent, error: singleError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (singleError) {
        console.error("❌ Error fetching single event:", singleError);
        return;
      }

      console.log("📋 Full event data:");
      console.log(JSON.stringify(singleEvent, null, 2));
    }
  } catch (error) {
    console.error("❌ Database connection error:", error);
    console.log("\n💡 Make sure to set your Supabase credentials:");
    console.log("   NEXT_PUBLIC_SUPABASE_URL=your-url");
    console.log("   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key");
  }
}

checkEventEndtime();
