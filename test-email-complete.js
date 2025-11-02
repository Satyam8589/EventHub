// Test email sending functionality
const testEmailSending = async () => {
  try {
    console.log("🧪 Testing Email API...");

    // First test the health check
    console.log("\n1️⃣ Testing GET endpoint (health check):");
    const healthResponse = await fetch(
      "http://localhost:3000/api/send-ticket-email",
      {
        method: "GET",
      }
    );

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log("✅ Health check passed:", healthData);
    } else {
      console.log(
        "❌ Health check failed:",
        healthResponse.status,
        healthResponse.statusText
      );
    }

    // Test email sending
    console.log("\n2️⃣ Testing POST endpoint (email sending):");
    const emailPayload = {
      booking_id: "test-booking-" + Date.now(),
      user_email: "satyaanuj8@gmail.com",
      user_name: "Test User",
      event_name: "Test Event",
      event_date: "2025-11-15",
      event_time: "7:00 PM",
      venue: "Test Venue",
    };

    console.log("📤 Sending request with payload:", emailPayload);

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
    console.log("📥 Raw response:", responseText);

    if (emailResponse.ok) {
      try {
        const emailData = JSON.parse(responseText);
        console.log("✅ Email API response:", emailData);
      } catch (e) {
        console.log("✅ Email sent, but response is not JSON:", responseText);
      }
    } else {
      console.log(
        "❌ Email API failed:",
        emailResponse.status,
        emailResponse.statusText
      );
      console.log("❌ Response:", responseText);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
};

// Run the test
testEmailSending();
