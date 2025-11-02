// Test production email API
const testEmailAPI = async () => {
  try {
    // First test the health check
    console.log("🔍 Testing email API health check...");
    const healthResponse = await fetch(
      "https://event-hub-sand.vercel.app/api/send-ticket-email",
      {
        method: "GET",
      }
    );

    const healthData = await healthResponse.json();
    console.log("✅ Health check response:", healthData);

    // Now test email sending with a real booking
    console.log("\n📧 Testing email sending...");
    const emailResponse = await fetch(
      "https://event-hub-sand.vercel.app/api/send-ticket-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: "test-booking-id-123",
          user_email: "satyaanuj8@gmail.com",
          user_name: "Test User",
        }),
      }
    );

    const emailData = await emailResponse.json();
    console.log("📧 Email test response:", emailData);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

testEmailAPI();
