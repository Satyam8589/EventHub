// Simple test to trigger migration using our Next.js API
async function testMigrationTrigger() {
  console.log("Testing migration trigger...\n");

  try {
    const response = await fetch(
      "http://localhost:3000/api/admin/scan-ticket",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrData: "28c3bfe1-1ab3-4494-aa43-dda7c6bbe94f_DAY_1_OF_2",
          scannedBy: "test-user",
          eventId: "test-event",
        }),
      }
    );

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error testing migration:", error.message);
  }
}

testMigrationTrigger();
