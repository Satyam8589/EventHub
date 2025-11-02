// Test enhanced QR scanning with various scenarios
async function testEnhancedQRScanning() {
  try {
    console.log("=== ENHANCED QR SCANNING TEST ===\n");

    // Test scenarios
    const testCases = [
      {
        name: "Valid UUID",
        bookingId: "cb7bde8a-c953-46c9-af7a-f5b5f8ec8d39",
        eventId: "8cad8d5d-b202-4e84-924c-9cbce7c6132f",
        scannedBy: "dqA7cIIUnfXi5koat8tjFtP8fpu1", // Gabbar's ID
      },
      {
        name: "Invalid Format - Too Short",
        bookingId: "invalid123",
        eventId: "8cad8d5d-b202-4e84-924c-9cbce7c6132f",
        scannedBy: "dqA7cIIUnfXi5koat8tjFtP8fpu1",
      },
      {
        name: "Invalid Format - Wrong Characters",
        bookingId: "cb7bde8a-c953-46c9-af7a-f5b5f8ec8d3Z", // Z at end
        eventId: "8cad8d5d-b202-4e84-924c-9cbce7c6132f",
        scannedBy: "dqA7cIIUnfXi5koat8tjFtP8fpu1",
      },
      {
        name: "Valid Format but Non-existent Booking",
        bookingId: "00000000-0000-0000-0000-000000000000",
        eventId: "8cad8d5d-b202-4e84-924c-9cbce7c6132f",
        scannedBy: "dqA7cIIUnfXi5koat8tjFtP8fpu1",
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n--- Testing: ${testCase.name} ---`);
      console.log(`Booking ID: ${testCase.bookingId}`);

      try {
        const response = await fetch(
          "http://localhost:3000/api/admin/scan-ticket",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(testCase),
          }
        );

        const result = await response.json();

        console.log(`Status: ${response.status}`);
        console.log(`Response:`, result);

        if (result.isValid) {
          console.log("✅ Scan successful");
        } else {
          console.log("❌ Scan failed:", result.message);
          if (result.debugInfo) {
            console.log("Debug info:", result.debugInfo);
          }
        }
      } catch (error) {
        console.log("❌ Request failed:", error.message);
      }
    }
  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
  }
}

testEnhancedQRScanning();
