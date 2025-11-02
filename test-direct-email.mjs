// Direct test of email function without database
import { sendTicketEmailWithRetry } from "./src/lib/email.js";

const testDirectEmail = async () => {
  console.log("🧪 Testing email function directly...");

  try {
    const result = await sendTicketEmailWithRetry(
      "satyaanuj8@gmail.com", // to
      "Test User", // userName
      "test-booking-123", // bookingId
      "Test Event Name", // eventName
      "November 15, 2025", // eventDate
      "7:00 PM", // eventTime
      "Test Venue", // venue
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" // qrCode (1x1 transparent PNG)
    );

    if (result.success) {
      console.log("✅ Email sent successfully!");
      console.log("📧 Message ID:", result.messageId);
    } else {
      console.log("❌ Email failed:", result.error);
    }
  } catch (error) {
    console.error("❌ Direct email test failed:", error);
    console.error("Stack:", error.stack);
  }
};

testDirectEmail();
