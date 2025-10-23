// Test the scan-ticket API directly
const fetch = require("node-fetch");

async function testScanTicket() {
  const bookingId = "cmh2jcw280001tvn0ku8hh78n";
  const scannedBy = "ir3s39E7QIcLd5TjO2X8ELCSxHF2";
  const eventId = "cmh2ht0in0003tvwoqux04xiz";

  console.log("Testing scan-ticket API...\n");
  console.log("Booking ID:", bookingId);
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
          bookingId: bookingId,
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
