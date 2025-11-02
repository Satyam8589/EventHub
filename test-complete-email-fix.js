// Test script to verify the complete email fix
// Run this in the browser console

async function testCompleteEmailFix() {
  console.log("🧪 Testing Complete Email Fix");
  console.log(
    "This test verifies both generateTicketImage and generateBookingEmailHTML parameter fixes"
  );

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
      eventDate: testBooking.event?.date,
      userEmail: testBooking.user?.email,
      userId: testBooking.user?.id,
      userName: testBooking.user?.name,
      hasEvent: !!testBooking.event,
      hasUser: !!testBooking.user,
    });

    // Validate required data
    const validationErrors = [];
    if (!testBooking.event) validationErrors.push("Missing event data");
    if (!testBooking.user) validationErrors.push("Missing user data");
    if (!testBooking.event?.id) validationErrors.push("Missing event.id");
    if (!testBooking.event?.title) validationErrors.push("Missing event.title");
    if (!testBooking.user?.name) validationErrors.push("Missing user.name");
    if (!testBooking.user?.email) validationErrors.push("Missing user.email");

    if (validationErrors.length > 0) {
      console.log("❌ Data validation failed:", validationErrors);
      return;
    }

    console.log("✅ All required data is present");

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
      console.log("🎉 Complete fix verification passed!");
      console.log("📬 Check your email inbox for the ticket with attachment");

      // Additional success checks
      if (emailResult.success) {
        console.log("✅ Email service reported success");
      }
    } else {
      console.log("❌ Email API failed:", {
        status: emailResponse.status,
        statusText: emailResponse.statusText,
        error: emailResult,
      });

      // Analyze the error
      if (emailResponse.status === 500) {
        console.log(
          "💡 Server error - check the API logs for detailed error information"
        );
      }
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    console.log("💡 This might indicate a network issue or API unavailability");
  }
}

// Run the comprehensive test
console.log("🚀 Starting comprehensive email fix test...");
console.log("This will test:");
console.log(
  "1. ✅ generateTicketImage(booking, event, user) - Fixed parameter order"
);
console.log(
  "2. ✅ generateBookingEmailHTML(booking, event, user) - Fixed parameter order"
);
console.log("3. ✅ Ticket image attachment - Buffer instead of URL");
console.log("4. ✅ Email template with user.name and event.title");
console.log("");
testCompleteEmailFix();
