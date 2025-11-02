// Test email configuration and booking lookup
import { supabase } from "./src/lib/supabase.js";

async function testEmailAndBooking() {
  console.log("=== EMAIL & BOOKING DEBUG TEST ===\n");

  // 1. Check environment variables
  console.log("1. Environment Variables Check:");
  console.log("GMAIL_USER:", process.env.GMAIL_USER ? "✅ Set" : "❌ Missing");
  console.log(
    "GMAIL_APP_PASSWORD:",
    process.env.GMAIL_APP_PASSWORD ? "✅ Set" : "❌ Missing"
  );
  console.log("");

  // 2. Test database connection
  console.log("2. Database Connection Test:");
  try {
    const { data: testData, error: testError } = await supabase
      .from("bookings")
      .select("id, status, eventId")
      .limit(1);

    if (testError) {
      console.log("❌ Database connection failed:", testError.message);
    } else {
      console.log("✅ Database connection successful");
      console.log("Sample booking:", testData[0] || "No bookings found");
    }
  } catch (error) {
    console.log("❌ Database connection error:", error.message);
  }
  console.log("");

  // 3. Get recent bookings to test with
  console.log("3. Recent Bookings:");
  try {
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        status,
        eventId,
        user:users(id, name, email),
        event:events(id, title, date)
      `
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (bookingsError) {
      console.log("❌ Error fetching bookings:", bookingsError.message);
    } else {
      console.log("✅ Found", bookings.length, "recent bookings:");
      bookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. Booking ID: ${booking.id}`);
        console.log(`     Status: ${booking.status}`);
        console.log(`     Event: ${booking.event?.title || "No event data"}`);
        console.log(
          `     User: ${booking.user?.name || "No user data"} (${
            booking.user?.email || "No email"
          })`
        );
        console.log("");
      });
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  // 4. Test QR code format
  console.log("4. QR Code Test:");
  try {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .limit(1);

    if (bookings && bookings.length > 0) {
      const testBookingId = bookings[0].id;
      console.log("Test booking ID:", testBookingId);
      console.log("ID type:", typeof testBookingId);
      console.log("ID length:", testBookingId.length);
      console.log("QR Code content would be:", testBookingId);
    }
  } catch (error) {
    console.log("❌ QR test error:", error.message);
  }
}

// Run the test
testEmailAndBooking()
  .then(() => {
    console.log("=== TEST COMPLETED ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
