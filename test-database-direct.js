// Direct database test for endtime field
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://wasrwhlzzmxqwiwwxtxe.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3J3aGx6em14cXdpd3d4dHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjM0MzQsImV4cCI6MjA3NjgzOTQzNH0.WIzDWe8LIjmk21lZuVBWlFp6Dusoj5pDpF42sz1MYfk";

console.log("🔍 DIRECT DATABASE TEST FOR ENDTIME");
console.log("===================================\n");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    // Test 1: Check if endtime column exists
    console.log("📋 Test 1: Checking table structure...");
    const { data: columns, error: columnError } = await supabase
      .rpc("get_table_columns", { table_name: "events" })
      .then(null, () => null); // Ignore error for now

    // Test 2: Fetch events with specific fields
    console.log("📋 Test 2: Fetching events with time fields...");
    const { data: events, error } = await supabase
      .from("events")
      .select("id, title, time, endtime, enddate")
      .limit(3);

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log(`✅ Found ${events.length} events:`);
    console.log("=".repeat(50));

    events.forEach((event, index) => {
      console.log(`${index + 1}. 📝 ${event.title} (ID: ${event.id})`);
      console.log(`   ⏰ Start: ${event.time || "NULL"}`);
      console.log(`   🏁 End Time: ${event.endtime || "NULL"}`);
      console.log(`   📅 End Date: ${event.enddate || "NULL"}`);
      console.log("");
    });

    // Test 3: Get full event data using the same query as API
    if (events.length > 0) {
      const testEventId = events[0].id;
      console.log(`🔍 Test 3: Full data for event ${testEventId}...`);

      const { data: fullEvent, error: fullError } = await supabase
        .from("events")
        .select("*")
        .eq("id", testEventId)
        .single();

      if (fullError) {
        console.error("❌ Full event error:", fullError);
        return;
      }

      console.log("📋 All time-related fields:");
      console.log("   time:", JSON.stringify(fullEvent.time));
      console.log("   endtime:", JSON.stringify(fullEvent.endtime));
      console.log("   endTime:", JSON.stringify(fullEvent.endTime));
      console.log("   enddate:", JSON.stringify(fullEvent.enddate));
      console.log("   endDate:", JSON.stringify(fullEvent.endDate));

      console.log("\n📋 All field names in event:");
      console.log(Object.keys(fullEvent).sort().join(", "));
    }
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
}

testDatabase();
