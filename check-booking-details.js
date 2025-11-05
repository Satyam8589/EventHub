// Check existing booking details for proper event ID
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xscrcrdnkyxdtwwwhfec.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY3JjcmRua3l4ZHR3d3doZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MTUwMTYsImV4cCI6MjA0NjI5MTAxNn0.GcdLhxoA2G2SKKoWY3wlKzqRuNP-Q18aNz6Py5wHx_k";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingDetails() {
  console.log("Checking booking details for migration test...\n");

  try {
    // Get booking with event details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        paymentId,
        scannedqrs,
        event:events(id, title),
        user:users(id, name)
      `
      )
      .eq("id", "28c3bfe1-1ab3-4494-aa43-dda7c6bbe94f")
      .single();

    if (error) {
      console.error("Error:", error);
      return;
    }

    console.log("Booking Details:");
    console.log("- Booking ID:", booking.id);
    console.log("- Event ID:", booking.event?.id);
    console.log("- Event Title:", booking.event?.title);
    console.log("- User:", booking.user?.name);
    console.log("- PaymentId:", booking.paymentId);
    console.log("- ScannedQRs:", booking.scannedqrs);
  } catch (error) {
    console.error("Connection error:", error.message);
  }
}

checkBookingDetails();
