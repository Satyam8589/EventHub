// Test the send-ticket-email API
// Run this in the browser console or create a test booking first

async function testSendTicketEmail() {
  console.log("🧪 Testing Send Ticket Email API");

  try {
    // First, get available bookings
    const bookingsResponse = await fetch("/api/bookings");
    const bookingsData = await bookingsResponse.json();

    if (!bookingsData.bookings || bookingsData.bookings.length === 0) {
      console.log("❌ No bookings found to test with");
      return;
    }

    const testBooking = bookingsData.bookings[0];
    console.log("📋 Testing with booking:", {
      id: testBooking.id,
      eventTitle: testBooking.event?.title,
      userEmail: testBooking.user?.email,
    });

    // Test the send email API
    console.log("📧 Sending test email...");
    const emailResponse = await fetch("/api/send-ticket-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: testBooking.id,
      }),
    });

    const emailResult = await emailResponse.json();

    if (emailResponse.ok) {
      console.log("✅ Email sent successfully:", emailResult);
    } else {
      console.log("❌ Email sending failed:", emailResult);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testSendTicketEmail();
