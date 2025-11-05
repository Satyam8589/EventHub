// Test migration logic for scanned tickets
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xscrcrdnkyxdtwwwhfec.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY3JjcmRua3l4ZHR3d3doZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MTUwMTYsImV4cCI6MjA0NjI5MTAxNn0.GcdLhxoA2G2SKKoWY3wlKzqRuNP-Q18aNz6Py5wHx_k";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigration() {
  console.log("Testing migration logic...\n");

  // Get a booking with scanned data in paymentId
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, paymentId, scannedqrs")
    .eq("id", "28c3bfe1-1ab3-4494-aa43-dda7c6bbe94f")
    .single();

  if (error) {
    console.error("Error fetching booking:", error);
    return;
  }

  console.log("Current booking data:");
  console.log("- ID:", booking.id);
  console.log("- PaymentId:", booking.paymentId);
  console.log("- ScannedQRs:", booking.scannedqrs);

  // Test migration logic
  let scannedTicketsData = {};

  if (booking.scannedqrs) {
    try {
      scannedTicketsData =
        typeof booking.scannedqrs === "string"
          ? JSON.parse(booking.scannedqrs)
          : booking.scannedqrs;
      console.log("\nData from scannedqrs:", scannedTicketsData);
    } catch (error) {
      console.error("Error parsing scannedqrs:", error);
    }
  } else if (
    booking.paymentId &&
    booking.paymentId.startsWith("SCANNED_TICKETS_")
  ) {
    try {
      const ticketsDataString = booking.paymentId.replace(
        "SCANNED_TICKETS_",
        ""
      );
      scannedTicketsData = JSON.parse(ticketsDataString);
      console.log("\nMigrating from paymentId:", scannedTicketsData);

      // Test the migration update
      const { error: migrationError } = await supabase
        .from("bookings")
        .update({
          scannedqrs: scannedTicketsData,
          paymentId: null,
        })
        .eq("id", booking.id);

      if (migrationError) {
        console.error("Migration error:", migrationError);
      } else {
        console.log("Migration successful!");

        // Verify the migration
        const { data: updatedBooking } = await supabase
          .from("bookings")
          .select("id, paymentId, scannedqrs")
          .eq("id", booking.id)
          .single();

        console.log("\nAfter migration:");
        console.log("- PaymentId:", updatedBooking.paymentId);
        console.log("- ScannedQRs:", updatedBooking.scannedqrs);
      }
    } catch (error) {
      console.error("Error during migration:", error);
    }
  }
}

testMigration();
