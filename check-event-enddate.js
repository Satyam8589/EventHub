// Check event data in database
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xscrcrdnkyxdtwwwhfec.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY3JjcmRua3l4ZHR3d3doZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MTUwMTYsImV4cCI6MjA0NjI5MTAxNn0.GcdLhxoA2G2SKKoWY3wlKzqRuNP-Q18aNz6Py5wHx_k";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventEndDate() {
  console.log("🔍 CHECKING EVENT END DATE IN DATABASE");
  console.log("=====================================\n");

  try {
    // Get the booking with event details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        scannedqrs,
        event:events(*)
      `
      )
      .eq("id", "28c3bfe1-1ab3-4494-aa43-dda7c6bbe94f")
      .single();

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log("📋 BOOKING DATA:");
    console.log("- Booking ID:", booking.id);
    console.log("- Scanned QRs:", booking.scannedqrs);

    console.log("\n🎯 EVENT DATA:");
    console.log("- Event ID:", booking.event?.id);
    console.log("- Event Title:", booking.event?.title);
    console.log("- Event Date:", booking.event?.date);
    console.log("- Event End Date:", booking.event?.endDate);
    console.log("- Event End date (lowercase):", booking.event?.enddate);
    console.log("- All Event Keys:", Object.keys(booking.event || {}));
    console.log("- Raw Event Object:", booking.event);

    // Check if end date exists and what the day calculation would be
    const startDate = new Date(booking.event.date);
    const endDateValue = booking.event.endDate || booking.event.enddate;

    console.log("\n📅 DATE ANALYSIS:");
    console.log("- Start Date:", startDate.toISOString());
    console.log("- End Date Value:", endDateValue);

    if (!endDateValue) {
      console.log("❌ NO END DATE FOUND!");
      console.log("💡 This is why the ticket shows as single-day");
      console.log(
        "🔧 Need to check if end date was saved correctly in database"
      );
    } else {
      const endDate = new Date(endDateValue);
      console.log("- End Date:", endDate.toISOString());

      // Calculate days
      const days = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log("- Calculated Days:", days.length);
      console.log(
        "- Day List:",
        days.map((d) => d.toDateString())
      );
    }

    // Also check scanned QR data to confirm it's multi-day
    if (booking.scannedqrs) {
      const scannedData = JSON.parse(booking.scannedqrs);
      console.log("\n🎫 SCANNED QR ANALYSIS:");
      console.log("- Scanned Days:", Object.keys(scannedData));
      console.log("- Day Count:", Object.keys(scannedData).length);
      console.log(
        "- This confirms it's a",
        Object.keys(scannedData).length,
        "day event"
      );
    }
  } catch (error) {
    console.error("❌ Check failed:", error);
  }
}

checkEventEndDate();
