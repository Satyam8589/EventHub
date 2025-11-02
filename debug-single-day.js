// Debug single-day event detection
console.log("🔍 Debugging Single-Day Event Detection");
console.log("=".repeat(50));

// Test with your actual event data structure
const testBooking = {
  id: "14417aa8-4d58-49a1-a11e-d627bba0a69b",
  tickets: 1,
  paymentId: 'SCANNED_TICKETS_{"1":"2024-11-02T10:00:00Z"}', // Single ticket scanned
  event: {
    title: "Serenity Symphony: A Two-Day Music & Wellness Retreat",
    date: "2025-11-02T07:00:00",
    endDate: "2025-11-03T07:00:00", // This might be the issue!
  },
  user: {
    name: "Satyam kumar singh",
  },
};

// Simulate the helper functions
function getScannedTicketsData(booking) {
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
}

function areAllTicketsScanned(booking) {
  const scannedTickets = getScannedTicketsData(booking);
  const totalTickets = booking.tickets || 1;
  const scannedCount = Object.keys(scannedTickets).length;

  // Calculate if this is a multi-day event
  const endDateValue = booking.event.endDate || booking.event.enddate;
  const isMultiDayEvent =
    endDateValue && new Date(endDateValue) > new Date(booking.event.date);

  console.log("🔍 Debug Info:");
  console.log("- Event title:", booking.event.title);
  console.log("- Start date:", booking.event.date);
  console.log("- End date:", endDateValue);
  console.log("- Start date parsed:", new Date(booking.event.date));
  console.log(
    "- End date parsed:",
    endDateValue ? new Date(endDateValue) : "None"
  );
  console.log("- Is multi-day calculated:", isMultiDayEvent);
  console.log("- Total tickets:", totalTickets);
  console.log("- Scanned count:", scannedCount);
  console.log(
    "- All scanned logic result:",
    !isMultiDayEvent ? "false (single-day)" : scannedCount >= totalTickets
  );

  // For single-day events, never show "all tickets used" message
  if (!isMultiDayEvent) {
    return false;
  }

  // For multi-day events, show completion message when all tickets used
  return scannedCount >= totalTickets;
}

console.log("📊 Test Results:");
console.log("Booking:", testBooking.event.title);
console.log("User:", testBooking.user.name);

const result = areAllTicketsScanned(testBooking);
console.log(`\n🎯 Show "All Tickets Used": ${result ? "YES ❌" : "NO ✅"}`);
console.log(`Expected for single-day: NO ✅`);
console.log(
  `\nDisplay Mode: ${
    result ? "❌ All Tickets Used Message" : "✅ Individual Ticket Status"
  }`
);

// Test the fix: Force single-day detection
console.log("\n🔧 Testing Potential Fix:");
console.log("If we force single-day detection...");

function areAllTicketsScannedFixed(booking) {
  const scannedTickets = getScannedTicketsData(booking);
  const totalTickets = booking.tickets || 1;
  const scannedCount = Object.keys(scannedTickets).length;

  // NEW LOGIC: Check if user only has 1 ticket (regardless of event duration)
  // If user has 1 ticket, always show individual status
  if (totalTickets === 1) {
    console.log("🎯 Single ticket booking - showing individual status");
    return false;
  }

  // For multi-ticket bookings, check if it's multi-day
  const endDateValue = booking.event.endDate || booking.event.enddate;
  const isMultiDayEvent =
    endDateValue && new Date(endDateValue) > new Date(booking.event.date);

  if (!isMultiDayEvent) {
    return false;
  }

  return scannedCount >= totalTickets;
}

const fixedResult = areAllTicketsScannedFixed(testBooking);
console.log(
  `Fixed logic result: ${
    fixedResult ? "Show All Tickets Used ❌" : "Show Individual Status ✅"
  }`
);

console.log("\n💡 Recommended Fix:");
console.log(
  "Change logic to: If user has only 1 ticket, ALWAYS show individual status"
);
console.log(
  "This covers both single-day events AND single-ticket purchases for multi-day events"
);
