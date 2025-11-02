// Simple test to get booking data and test email
async function testBookingAndEmail() {
  try {
    console.log("=== BOOKING & EMAIL TEST ===\n");

    // 1. Get bookings
    console.log("1. Fetching bookings...");
    const bookingsResponse = await fetch("http://localhost:3000/api/bookings");
    const bookingsData = await bookingsResponse.json();

    if (bookingsData.bookings && bookingsData.bookings.length > 0) {
      const testBooking = bookingsData.bookings[0];
      console.log("✅ Found booking to test:");
      console.log(`   Booking ID: ${testBooking.id}`);
      console.log(`   Status: ${testBooking.status}`);
      console.log(`   User ID: ${testBooking.userId}`);
      console.log(`   Event ID: ${testBooking.eventId}`);

      // 2. Test email sending
      console.log("\n2. Testing email sending...");
      const emailResponse = await fetch(
        "http://localhost:3000/api/send-ticket-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: testBooking.id,
          }),
        }
      );

      const emailResult = await emailResponse.json();
      console.log("Email response status:", emailResponse.status);
      console.log("Email response:", emailResult);

      if (emailResult.success) {
        console.log("✅ Email sent successfully!");
      } else {
        console.log("❌ Email failed:", emailResult.error);
      }
    } else {
      console.log("❌ No bookings found");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testBookingAndEmail();
