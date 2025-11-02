// Test script to verify the generateTicketImage fix
// Run this in the browser console

async function testEmailAPIFix() {
  console.log("🧪 Testing Email API Fix");

  try {
    // First, get available bookings
    console.log("📋 Fetching bookings...");
    const bookingsResponse = await fetch("/api/bookings");
    const bookingsData = await bookingsResponse.json();

    if (!bookingsData.bookings || bookingsData.bookings.length === 0) {
      console.log("❌ No bookings found to test with");
      return;
    }

    const testBooking = bookingsData.bookings[0];
    console.log("🎫 Testing with booking:", {
      id: testBooking.id,
      eventTitle: testBooking.event?.title,
      eventId: testBooking.event?.id,
      userEmail: testBooking.user?.email,
      userId: testBooking.user?.id,
      hasEvent: !!testBooking.event,
      hasUser: !!testBooking.user,
    });

    if (!testBooking.event) {
      console.log("❌ Test booking has no event data");
      return;
    }

    if (!testBooking.user) {
      console.log("❌ Test booking has no user data");
      return;
    }

    // Test the send email API
    console.log("📧 Sending test email...");
    const startTime = Date.now();

    const emailResponse = await fetch("/api/send-ticket-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: testBooking.id,
      }),
    });

    const endTime = Date.now();
    const emailResult = await emailResponse.json();

    console.log(`⏱️ API call took ${endTime - startTime}ms`);

    if (emailResponse.ok) {
      console.log("✅ Email API succeeded:", emailResult);
      console.log("🎉 The generateTicketImage fix worked!");
    } else {
      console.log("❌ Email API failed:", {
        status: emailResponse.status,
        statusText: emailResponse.statusText,
        error: emailResult,
      });
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
console.log("🚀 Starting email API fix test...");
testEmailAPIFix();
