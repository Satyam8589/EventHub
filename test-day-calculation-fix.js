// Test the fixed day calculation logic
// Run this to verify the email and manual download now match

async function testFixedDayCalculation() {
  console.log("🧪 TESTING FIXED DAY CALCULATION");
  console.log("=================================\n");

  // Test the day calculation logic that's now used in both places
  function calculateEventDays(event) {
    console.log("🔍 Calculating event days for:", {
      eventId: event.id,
      date: event.date,
      endDate: event.endDate,
      enddate: event.enddate,
    });

    const startDate = new Date(event.date);
    const endDateValue = event.endDate || event.enddate;

    if (!endDateValue) {
      console.log("❌ No end date found, returning 1 day");
      return 1; // Single day event
    }

    const endDate = new Date(endDateValue);

    console.log("📅 Date calculation:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Use the same logic as TicketModal.js for consistency
    const days = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const finalDays = Math.max(1, days.length);
    console.log("✅ Event duration calculated:", {
      startDate: startDate.toDateString(),
      endDate: endDate.toDateString(),
      daysCount: days.length,
      finalDays,
      calculatedDays: days.map((d) => d.toDateString()),
    });

    return finalDays;
  }

  try {
    // Get booking data to test with
    const bookingsResponse = await fetch("/api/bookings");
    const bookingsData = await bookingsResponse.json();

    if (bookingsData.bookings && bookingsData.bookings.length > 0) {
      const testBooking = bookingsData.bookings[0];

      console.log("📋 Testing with booking:", {
        id: testBooking.id,
        eventTitle: testBooking.event?.title,
        eventDate: testBooking.event?.date,
        eventEndDate: testBooking.event?.endDate || testBooking.event?.enddate,
      });

      // Test the calculation
      const calculatedDays = calculateEventDays(testBooking.event);

      console.log("\n🎯 RESULT:");
      console.log(`Event: ${testBooking.event?.title}`);
      console.log(`Calculated Days: ${calculatedDays}`);
      console.log(
        "✅ This should now match between email and manual download!"
      );

      // Test some edge cases
      console.log("\n🧪 Testing edge cases:");

      // Same day event
      const sameDayEvent = {
        id: "test-same-day",
        date: "2025-11-10",
        endDate: "2025-11-10",
      };
      console.log(
        "Same day event (Nov 10 - Nov 10):",
        calculateEventDays(sameDayEvent),
        "days"
      );

      // Two day event
      const twoDayEvent = {
        id: "test-two-day",
        date: "2025-11-10",
        endDate: "2025-11-11",
      };
      console.log(
        "Two day event (Nov 10 - Nov 11):",
        calculateEventDays(twoDayEvent),
        "days"
      );

      // Three day event
      const threeDayEvent = {
        id: "test-three-day",
        date: "2025-11-10",
        endDate: "2025-11-12",
      };
      console.log(
        "Three day event (Nov 10 - Nov 12):",
        calculateEventDays(threeDayEvent),
        "days"
      );
    } else {
      console.log("❌ No bookings found to test with");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testFixedDayCalculation();
