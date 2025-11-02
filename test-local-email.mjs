// Local test for email functionality
import { sendTicketEmailWithRetry } from "./src/lib/email.js";

const testLocalEmail = async () => {
  try {
    console.log("🧪 Testing local email function...");

    const result = await sendTicketEmailWithRetry(
      "satyaanuj8@gmail.com",
      "Test User",
      "test-booking-123",
      "Test Event",
      new Date().toLocaleDateString(),
      "12:00 PM",
      "Test Venue",
      "https://via.placeholder.com/400x200/blue/white?text=Test+QR+Code"
    );

    if (result.success) {
      console.log("✅ Email sent successfully!");
      console.log("Message ID:", result.messageId);
    } else {
      console.log("❌ Email failed:", result.error);
    }
  } catch (error) {
    console.error("❌ Test error:", error);
  }
};

testLocalEmail();
