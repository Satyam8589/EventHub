// Test complete QR scanning flow
async function testCompleteQRFlow() {
  try {
    console.log("=== COMPLETE QR SCANNING TEST ===\n");

    // 1. Get users and find admin
    console.log("1. Checking user roles...");
    const usersResponse = await fetch("http://localhost:3000/api/users");
    const usersData = await usersResponse.json();

    console.log("Found users:");
    usersData.users.forEach((user) => {
      console.log(`   ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    const adminUser = usersData.users.find(
      (user) => user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN"
    );

    if (!adminUser) {
      console.log("❌ No admin user found. Current user roles:");
      usersData.users.forEach((user) => {
        console.log(`   ${user.name}: ${user.role}`);
      });

      // Let's promote the first user to admin for testing
      const firstUser = usersData.users[0];
      console.log(
        `\n2. Promoting ${firstUser.name} to SUPER_ADMIN for testing...`
      );

      // We would need an API to update user role, but let's continue with current user
      console.log(
        "❌ Cannot proceed without admin user. Need to promote a user to admin role."
      );
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.role})`);

    // 2. Get a booking to test
    console.log("\n3. Getting test booking...");
    const bookingsResponse = await fetch("http://localhost:3000/api/bookings");
    const bookingsData = await bookingsResponse.json();

    if (!bookingsData.bookings || bookingsData.bookings.length === 0) {
      console.log("❌ No bookings found");
      return;
    }

    const testBooking = bookingsData.bookings[0];
    console.log(
      `✅ Using booking: ${testBooking.id} for event: ${testBooking.eventId}`
    );

    // 3. Test the scan
    console.log("\n4. Testing QR scan...");
    console.log("Scan request data:");
    console.log(`   Booking ID: ${testBooking.id}`);
    console.log(`   Scanner ID: ${adminUser.id}`);
    console.log(`   Event ID: ${testBooking.eventId}`);

    const scanRequest = {
      bookingId: testBooking.id,
      scannedBy: adminUser.id,
      eventId: testBooking.eventId,
    };

    const scanResponse = await fetch(
      "http://localhost:3000/api/admin/scan-ticket",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scanRequest),
      }
    );

    console.log(`Response status: ${scanResponse.status}`);

    const scanResult = await scanResponse.text(); // Get as text first
    console.log("Raw response:", scanResult);

    try {
      const jsonResult = JSON.parse(scanResult);
      console.log("Parsed result:", jsonResult);

      if (scanResponse.ok && jsonResult.isValid) {
        console.log("✅ QR scan successful!");
      } else {
        console.log("❌ QR scan failed:", jsonResult.error || "Unknown error");
      }
    } catch (parseError) {
      console.log("❌ Response is not valid JSON. Raw response:", scanResult);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

testCompleteQRFlow();
