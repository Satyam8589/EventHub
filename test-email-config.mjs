// Check email configuration
console.log("🔍 Checking email configuration...");
console.log("GMAIL_USER:", process.env.GMAIL_USER ? "✅ SET" : "❌ MISSING");
console.log(
  "GMAIL_APP_PASSWORD:",
  process.env.GMAIL_APP_PASSWORD ? "✅ SET" : "❌ MISSING"
);

// Test email function with correct signature
import { sendTicketEmailWithRetry } from "./src/lib/email.js";

const testEmailCorrectly = async () => {
  try {
    console.log("\n📧 Testing email with correct function signature...");

    const emailOptions = {
      to: "satyaanuj8@gmail.com",
      subject: "🎫 Your EventHub Ticket - Test Event",
      html: `
        <h1>Your Ticket for Test Event</h1>
        <p>Dear Test User,</p>
        <p>Your booking has been confirmed!</p>
        <p><strong>Event:</strong> Test Event</p>
        <p><strong>Date:</strong> November 15, 2025</p>
        <p><strong>Time:</strong> 7:00 PM</p>
        <p><strong>Venue:</strong> Test Venue</p>
        <p><strong>Booking ID:</strong> test-booking-123</p>
      `,
      attachments: [],
    };

    console.log("📤 Sending email with options:", {
      to: emailOptions.to,
      subject: emailOptions.subject,
      hasHtml: !!emailOptions.html,
      attachments: emailOptions.attachments.length,
    });

    const result = await sendTicketEmailWithRetry(emailOptions);

    if (result && result.success) {
      console.log("✅ Email sent successfully!");
      console.log("📧 Message ID:", result.messageId);
    } else {
      console.log("❌ Email failed:", result?.error || "Unknown error");
    }
  } catch (error) {
    console.error("❌ Email test failed:", error.message);
  }
};

testEmailCorrectly();
