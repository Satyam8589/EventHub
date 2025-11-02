// Test progressive ticket scanning
const testProgressiveScanning = async () => {
  try {
    console.log("🧪 Testing Progressive Ticket Scanning System");
    console.log("=".repeat(50));

    // Test the scan endpoint with a known booking ID
    const testBookingId = "cmh2jcw280001tvn0ku8hh78n"; // Replace with actual booking ID
    const testEventId = "cm6z8e5ra000112xsmkcbayq2"; // Replace with actual event ID
    const testScannerId = "cm6woh0f5000113qy9yl5l1cn"; // Replace with actual scanner ID

    console.log("📝 Test Parameters:");
    console.log("- Booking ID:", testBookingId);
    console.log("- Event ID:", testEventId);
    console.log("- Scanner ID:", testScannerId);
    console.log("");

    // Simulate scanning the ticket
    console.log("📡 Sending scan request...");
    const scanResponse = await fetch(
      "http://localhost:3000/api/admin/scan-ticket",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: testBookingId,
          eventId: testEventId,
          scannedBy: testScannerId,
        }),
      }
    );

    const scanResult = await scanResponse.json();
    console.log("📊 Scan Response Status:", scanResponse.status);
    console.log("📊 Scan Response:", JSON.stringify(scanResult, null, 2));

    if (scanResult.booking && scanResult.booking.progressInfo) {
      console.log("\n🎯 Progressive Scanning Info:");
      console.log(
        "- Current Event Day:",
        scanResult.booking.progressInfo.currentDay
      );
      console.log(
        "- Ticket Used Today:",
        scanResult.booking.progressInfo.ticketUsedToday
      );
      console.log(
        "- Remaining Tickets:",
        scanResult.booking.progressInfo.remainingTickets
      );
      console.log(
        "- Next Ticket Available:",
        scanResult.booking.progressInfo.nextTicketAvailable
      );
      console.log(
        "- All Scanned Tickets:",
        scanResult.booking.progressInfo.allScannedTickets
      );
    }

    // Test getting statistics
    console.log("\n📈 Testing Statistics Endpoint...");
    const statsResponse = await fetch(
      `http://localhost:3000/api/admin/scan-ticket?eventId=${testEventId}&scannerId=${testScannerId}`
    );

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log(
        "📊 Statistics:",
        JSON.stringify(statsData.statistics, null, 2)
      );

      if (statsData.scannedBookings && statsData.scannedBookings.length > 0) {
        console.log("\n📋 Scanned Bookings:");
        statsData.scannedBookings.forEach((booking, index) => {
          console.log(
            `${index + 1}. ${booking.userName}: ${booking.scannedTickets}/${
              booking.totalTickets
            } tickets scanned`
          );
          console.log(
            `   Scanned tickets: ${JSON.stringify(booking.scannedTicketsData)}`
          );
        });
      }
    } else {
      console.log("❌ Statistics request failed:", statsResponse.status);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Test different scenarios
const testScenarios = async () => {
  console.log("\n🎭 Testing Different Scenarios:");
  console.log("=".repeat(50));

  // You can add different test scenarios here:
  // 1. First day scanning (should allow ticket #1)
  // 2. Second day scanning (should allow ticket #2)
  // 3. Already scanned today (should reject)
  // 4. Event not started yet (should reject)
  // 5. All tickets used (should reject)

  console.log("💡 To test different days:");
  console.log("1. Change your system date to test different event days");
  console.log("2. Or modify the event date in the database");
  console.log(
    "3. Create bookings with different ticket counts (1, 2, 3+ tickets)"
  );
};

console.log("🚀 Starting Progressive Scanning Tests...");
testProgressiveScanning().then(() => {
  testScenarios();
});
