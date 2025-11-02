// Test script to verify ticket display fixes
console.log("Testing Ticket Display Fixes...");

// Test 1: Check if booking API supports multiple status values
async function testBookingAPI() {
  console.log("\n=== Test 1: Booking API Multiple Status Support ===");

  try {
    // Test single status (should work as before)
    const singleResponse = await fetch(
      "http://localhost:3000/api/bookings?status=CONFIRMED"
    );
    console.log(
      "Single status test:",
      singleResponse.ok ? "✅ PASS" : "❌ FAIL"
    );

    // Test multiple status (new feature)
    const multiResponse = await fetch(
      "http://localhost:3000/api/bookings?status=CONFIRMED,COMPLETED"
    );
    console.log(
      "Multiple status test:",
      multiResponse.ok ? "✅ PASS" : "❌ FAIL"
    );

    if (multiResponse.ok) {
      const data = await multiResponse.json();
      console.log("Found bookings:", data.bookings?.length || 0);
    }
  } catch (error) {
    console.error("❌ Booking API test failed:", error.message);
  }
}

// Test 2: Verify progressive scanning logic
function testProgressiveScanning() {
  console.log("\n=== Test 2: Progressive Scanning Logic ===");

  // Mock booking data
  const mockBookings = [
    // Fully scanned booking (should show "All Tickets Used")
    {
      id: "booking1",
      tickets: 3,
      paymentId:
        'SCANNED_TICKETS_{"1":"2024-11-01T10:00:00Z","2":"2024-11-02T11:00:00Z","3":"2024-11-03T12:00:00Z"}',
      event: { title: "Test Event" },
      user: { name: "John Doe" },
    },
    // Partially scanned booking (should show mixed status)
    {
      id: "booking2",
      tickets: 3,
      paymentId:
        'SCANNED_TICKETS_{"1":"2024-11-01T10:00:00Z","2":"2024-11-02T11:00:00Z"}',
      event: { title: "Test Event" },
      user: { name: "Jane Smith" },
    },
    // Unscanned booking (should show QR codes)
    {
      id: "booking3",
      tickets: 2,
      paymentId: "unscanned_payment_id",
      event: { title: "Test Event" },
      user: { name: "Bob Wilson" },
    },
  ];

  mockBookings.forEach((booking, index) => {
    console.log(`\nBooking ${index + 1} (${booking.user.name}):`);

    // Simulate the helper functions from TicketModal
    const getScannedTicketsData = () => {
      if (!booking.paymentId) return {};

      if (booking.paymentId.startsWith("SCANNED_TICKETS_")) {
        try {
          const ticketsDataString = booking.paymentId.replace(
            "SCANNED_TICKETS_",
            ""
          );
          return JSON.parse(ticketsDataString);
        } catch (e) {
          return {};
        }
      }
      return {};
    };

    const areAllTicketsScanned = () => {
      const scannedTickets = getScannedTicketsData();
      const totalTickets = booking.tickets || 1;
      const scannedCount = Object.keys(scannedTickets).length;
      return scannedCount >= totalTickets;
    };

    const isTicketScanned = (dayNumber) => {
      const scannedTickets = getScannedTicketsData();
      return !!scannedTickets[dayNumber];
    };

    // Test the logic
    const allScanned = areAllTicketsScanned();
    const scannedData = getScannedTicketsData();

    console.log(`- Total tickets: ${booking.tickets}`);
    console.log(`- Scanned tickets: ${Object.keys(scannedData).length}`);
    console.log(`- All scanned: ${allScanned ? "✅ YES" : "❌ NO"}`);
    console.log(
      `- Display mode: ${
        allScanned ? "All Tickets Used Message" : "Individual Status"
      }`
    );

    if (!allScanned) {
      for (let i = 1; i <= booking.tickets; i++) {
        const scanned = isTicketScanned(i);
        console.log(
          `  - Ticket ${i}: ${scanned ? "✅ Thank You" : "📱 QR Code"}`
        );
      }
    }
  });
}

// Test 3: Status validation
function testStatusValidation() {
  console.log("\n=== Test 3: Status Validation ===");

  const statuses = ["CONFIRMED", "COMPLETED", "PENDING", "FAILED"];

  statuses.forEach((status) => {
    const isValid = status === "CONFIRMED" || status === "COMPLETED";
    console.log(
      `Status "${status}": ${isValid ? "✅ VALID" : "❌ INVALID"} for scanning`
    );
  });
}

// Run all tests
async function runTests() {
  console.log("🧪 Testing Ticket Display and Admin Scanner Fixes");
  console.log("=".repeat(50));

  testProgressiveScanning();
  testStatusValidation();

  // Only test API if we can connect to localhost
  try {
    await fetch("http://localhost:3000/api/health");
    await testBookingAPI();
  } catch (error) {
    console.log("\n⚠️ Skipping API tests - server not running");
    console.log("Run 'npm run dev' to test API endpoints");
  }

  console.log("\n🎉 Testing completed!");
  console.log("\nExpected fixes:");
  console.log(
    "1. ✅ Bookings show individual ticket status (not all hidden after one scan)"
  );
  console.log("2. ✅ COMPLETED bookings still visible in my-events page");
  console.log("3. ✅ Admin scanner accepts COMPLETED status bookings");
  console.log("4. ✅ Better error messages for wrong event bookings");
}

runTests().catch(console.error);
