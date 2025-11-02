// Test script for manual email sending functionality
// Run this in the browser console on the My Events page

console.log("🧪 Testing Manual Email Functionality");

// Test 1: Check if API endpoint exists
async function testEmailAPI() {
  try {
    const response = await fetch("/api/send-ticket-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: "test-id", // This will fail but confirms endpoint exists
      }),
    });

    const result = await response.json();
    console.log("✅ Email API endpoint exists", result);
  } catch (error) {
    console.error("❌ Email API test failed:", error);
  }
}

// Test 2: Check date/time filtering logic
function testEventExpiration() {
  const now = new Date();

  // Test cases
  const testEvents = [
    {
      id: 1,
      endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
      time: "18:00",
    },
    {
      id: 2,
      endDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], // Yesterday
      time: "18:00",
    },
    {
      id: 3,
      endDate: new Date().toISOString().split("T")[0], // Today
      time: "09:00", // Morning (if current time is after 9 AM, this should be expired)
    },
    {
      id: 4,
      endDate: new Date().toISOString().split("T")[0], // Today
      time: "23:59", // Late night (should not be expired)
    },
  ];

  console.log("📅 Testing event expiration logic:");
  console.log("Current time:", now.toLocaleString());

  testEvents.forEach((event) => {
    const eventEndDateTime = new Date(`${event.endDate}T${event.time}`);
    const isExpired = eventEndDateTime <= now;

    console.log(
      `Event ${event.id} (${event.endDate} ${event.time}): ${
        isExpired ? "🔴 EXPIRED" : "🟢 ACTIVE"
      }`
    );
  });
}

// Test 3: Verify email button states
function testEmailButtonStates() {
  const buttons = document.querySelectorAll(
    'button[onclick*="sendTicketEmail"]'
  );
  console.log(`📧 Found ${buttons.length} email buttons on page`);

  buttons.forEach((button, index) => {
    console.log(`Button ${index + 1}:`, {
      text: button.textContent.trim(),
      disabled: button.disabled,
      classes: button.className,
    });
  });
}

// Run all tests
console.log("🚀 Running tests...");
testEmailAPI();
testEventExpiration();
testEmailButtonStates();

console.log("✨ Test script completed. Check results above.");
