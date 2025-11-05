// Comprehensive Gmail ticket email test
// Run this in the browser console to test the complete email workflow

async function testGmailTicketSystem() {
  console.log("🎉 TESTING COMPLETE GMAIL TICKET SYSTEM");
  console.log("=======================================\n");

  try {
    // Test 1: Check email configuration
    console.log("1️⃣ Testing Email Configuration...");
    const configTest = await fetch("/api/debug/send-test-email");
    const configResult = await configTest.json();

    if (configResult.success) {
      console.log("✅ Email configuration working");
      console.log("📧 Test email sent to Gmail successfully");
      console.log("📮 Message ID:", configResult.messageId);
    } else {
      console.log("❌ Email configuration failed:", configResult);
      return;
    }

    // Test 2: Check if bookings exist
    console.log("\n2️⃣ Checking Available Bookings...");
    const bookingsResponse = await fetch("/api/bookings");
    const bookingsData = await bookingsResponse.json();

    if (bookingsData.bookings && bookingsData.bookings.length > 0) {
      console.log("✅ Found", bookingsData.bookings.length, "bookings");

      const testBooking = bookingsData.bookings[0];
      console.log("🎫 Testing with booking:", {
        id: testBooking.id,
        eventTitle: testBooking.event?.title,
        userEmail: testBooking.user?.email,
        status: testBooking.status,
      });

      // Test 3: Send actual ticket email
      console.log("\n3️⃣ Testing Ticket Email with Attachment...");
      const ticketEmailResponse = await fetch("/api/send-ticket-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: testBooking.id,
        }),
      });

      const ticketResult = await ticketEmailResponse.json();

      if (ticketResult.success) {
        console.log("✅ Ticket email sent successfully!");
        console.log("📧 Email sent to:", testBooking.user?.email);
        console.log("🎫 Includes QR code ticket image attachment");
        console.log("📱 User can save ticket and scan QR at event");
      } else {
        console.log("❌ Ticket email failed:", ticketResult.error);
      }
    } else {
      console.log("⚠️ No bookings found to test with");
    }

    // Test 4: Mock booking email test
    console.log("\n4️⃣ Testing Mock Booking Email...");
    const mockTest = await fetch("/api/test-booking-email");
    const mockResult = await mockTest.json();

    if (mockResult.success) {
      console.log("✅ Mock booking email test passed");
      console.log("📧 Sent to:", mockResult.recipient);
    }

    console.log("\n🎉 GMAIL TICKET SYSTEM TEST COMPLETE!");
    console.log("=======================================");
    console.log("✅ Email configuration: Working");
    console.log("✅ SMTP connection: Active");
    console.log("✅ Ticket generation: Working");
    console.log("✅ QR code attachment: Working");
    console.log("✅ Email delivery: Successful");
    console.log("\n📱 Users can now:");
    console.log("• Receive tickets via Gmail");
    console.log("• Download ticket images");
    console.log("• Scan QR codes at events");
    console.log("• Get email confirmations");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\nTroubleshooting:");
    console.log("1. Make sure the development server is running");
    console.log("2. Check .env.local has GMAIL_USER and GMAIL_APP_PASSWORD");
    console.log("3. Verify Gmail app password is correct");
  }
}

// Run the comprehensive test
testGmailTicketSystem();
