// Test the scan-ticket API directly
// Using built-in fetch available in Node.js 18+

async function testScanTicket() {
  // Use an existing booking ID we know has scanned data for migration test
  const qrCode = "28c3bfe1-1ab3-4494-aa43-dda7c6bbe94f_DAY_1_OF_2";
  const scannedBy = "test-admin-migration";
  const eventId = "test-event-migration";

  console.log("Testing scan-ticket API migration logic...\n");
  console.log("QR Code:", qrCode);
  console.log("Scanner ID:", scannedBy);
  console.log("Event ID:", eventId);
  console.log("\n");

  try {
    const response = await fetch(
      "http://localhost:3000/api/admin/scan-ticket",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: qrCode,
          scannedBy: scannedBy,
          eventId: eventId,
        }),
      }
    );

    const data = await response.json();

    console.log("Response Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testScanTicket();
