const { createClient } = require("@supabase/supabase-js");

async function checkScannedQRsColumn() {
  const supabase = createClient(
    "https://wasrwhlzzmxqwiwwxtxe.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3J3aGx6em14cXdpd3d4dHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjM0MzQsImV4cCI6MjA3NjgzOTQzNH0.WIzDWe8LIjmk21lZuVBWlFp6Dusoj5pDpF42sz1MYfk"
  );

  const eventId = "0fbb5e44-4057-4e04-8258-751ad39f30a4";

  try {
    // Get bookings for this event to see the scannedqrs structure
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, paymentId, scannedqrs, user:users(name)")
      .eq("eventId", eventId);

    if (error) {
      console.error("Error fetching bookings:", error);
      return;
    }

    console.log("=".repeat(80));
    console.log("BOOKINGS SCANNEDQRS COLUMN ANALYSIS");
    console.log("=".repeat(80));

    bookings.forEach((booking, index) => {
      console.log(`\\nBooking ${index + 1}:`);
      console.log("- ID:", booking.id);
      console.log("- User:", booking.user?.name || "Unknown");
      console.log("- PaymentId:", booking.paymentId);
      console.log("- ScannedQRs:", booking.scannedqrs);
      console.log("- ScannedQRs type:", typeof booking.scannedqrs);

      if (booking.scannedqrs) {
        try {
          const parsed =
            typeof booking.scannedqrs === "string"
              ? JSON.parse(booking.scannedqrs)
              : booking.scannedqrs;
          console.log("- ScannedQRs parsed:", parsed);
        } catch (e) {
          console.log("- ScannedQRs parse error:", e.message);
        }
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

checkScannedQRsColumn();
