// Test QR scanning functionality
async function testQRScanning() {
  try {
    console.log("=== QR SCANNING TEST ===\n");

    // 1. Get a valid booking to test with
    console.log("1. Getting test booking...");
    const bookingsResponse = await fetch("http://localhost:3000/api/bookings");
    const bookingsData = await bookingsResponse.json();

    if (!bookingsData.bookings || bookingsData.bookings.length === 0) {
      console.log("❌ No bookings found to test with");
      return;
    }

    const testBooking = bookingsData.bookings[0];
    console.log("✅ Test booking found:");
    console.log(`   Booking ID: ${testBooking.id}`);
    console.log(`   Event ID: ${testBooking.eventId}`);
    console.log(`   Status: ${testBooking.status}`);
    console.log(`   User ID: ${testBooking.userId}`);

    // 2. Test scanning this booking
    console.log("\n2. Testing QR scan...");

    // We need a valid scanner (admin user) - let's get one
    const usersResponse = await fetch("http://localhost:3000/api/admin/users");
    const usersData = await usersResponse.json();

    let adminUser = null;
    if (usersData.users) {
      adminUser = usersData.users.find(
        (user) => user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN"
      );
    }

    if (!adminUser) {
      console.log("❌ No admin user found to test scanning");
      return;
    }

    console.log(
      `✅ Using admin scanner: ${adminUser.name} (${adminUser.role})`
    );

    // 3. Perform the scan
    const scanResponse = await fetch(
      "http://localhost:3000/api/admin/scan-ticket",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: testBooking.id,
          scannedBy: adminUser.id,
          eventId: testBooking.eventId,
        }),
      }
    );

    const scanResult = await scanResponse.json();
    console.log("\n3. Scan result:");
    console.log("Response status:", scanResponse.status);
    console.log("Response data:", JSON.stringify(scanResult, null, 2));

    if (scanResponse.ok && scanResult.isValid) {
      console.log("✅ QR scan successful!");
    } else {
      console.log("❌ QR scan failed:", scanResult.error || "Unknown error");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testQRScanning();
