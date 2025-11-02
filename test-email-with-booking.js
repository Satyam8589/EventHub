// Test with correct API format and check database
const testEmailWithValidBooking = async () => {
  try {
    console.log("🔍 First, let's check available bookings...");

    // Check what bookings exist
    const bookingsResponse = await fetch("http://localhost:3000/api/bookings");
    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      console.log(
        "📚 Available bookings:",
        bookingsData.length > 0 ? bookingsData.slice(0, 3) : "No bookings found"
      );

      if (bookingsData.length > 0) {
        const firstBooking = bookingsData[0];
        console.log("\n🎯 Using booking:", firstBooking.id);

        // Test email with real booking ID
        console.log("\n📧 Testing email with real booking...");
        const emailPayload = {
          bookingId: firstBooking.id, // Note: bookingId not booking_id
        };

        const emailResponse = await fetch(
          "http://localhost:3000/api/send-ticket-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
          }
        );

        const responseText = await emailResponse.text();
        console.log("📥 Email API response:", responseText);

        if (emailResponse.ok) {
          console.log("✅ Email sent successfully!");
        } else {
          console.log("❌ Email failed:", emailResponse.status);
        }
      } else {
        console.log("⚠️ No bookings available to test with");
      }
    } else {
      console.log("❌ Could not fetch bookings:", bookingsResponse.status);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

testEmailWithValidBooking();
