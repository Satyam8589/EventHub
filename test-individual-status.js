// Test the fixed ticket display logic
console.log("🧪 Testing Fixed Individual Ticket Status Display");
console.log("=".repeat(50));

// Simulate the helper functions from TicketModal
function testTicketDisplay(booking) {
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

  const isTicketScanned = (dayNumber) => {
    const scannedTickets = getScannedTicketsData();
    return !!scannedTickets[dayNumber];
  };

  const areAllTicketsScanned = () => {
    const scannedTickets = getScannedTicketsData();
    const totalTickets = booking.tickets || 1;
    const scannedCount = Object.keys(scannedTickets).length;

    // Calculate if this is a multi-day event
    const endDateValue = booking.event.endDate || booking.event.enddate;
    const isMultiDayEvent =
      endDateValue && new Date(endDateValue) > new Date(booking.event.date);

    // For single-day events, never show "all tickets used" message
    if (!isMultiDayEvent) {
      return false;
    }

    // For multi-day events, show completion message when all tickets used
    return scannedCount >= totalTickets;
  };

  return { getScannedTicketsData, isTicketScanned, areAllTicketsScanned };
}

// Test cases
const testCases = [
  {
    name: "Single-day event, 1 ticket, scanned",
    booking: {
      id: "booking1",
      tickets: 1,
      paymentId: 'SCANNED_TICKETS_{"1":"2024-11-02T10:00:00Z"}',
      event: {
        title: "Single Day Event",
        date: "2024-11-02",
        endDate: null,
      },
    },
  },
  {
    name: "Single-day event, 1 ticket, not scanned",
    booking: {
      id: "booking2",
      tickets: 1,
      paymentId: "payment_12345",
      event: {
        title: "Single Day Event",
        date: "2024-11-02",
        endDate: null,
      },
    },
  },
  {
    name: "Multi-day event, 3 tickets, all scanned",
    booking: {
      id: "booking3",
      tickets: 3,
      paymentId:
        'SCANNED_TICKETS_{"1":"2024-11-01T10:00:00Z","2":"2024-11-02T11:00:00Z","3":"2024-11-03T12:00:00Z"}',
      event: {
        title: "Multi Day Event",
        date: "2024-11-01",
        endDate: "2024-11-03",
      },
    },
  },
  {
    name: "Multi-day event, 3 tickets, partially scanned",
    booking: {
      id: "booking4",
      tickets: 3,
      paymentId:
        'SCANNED_TICKETS_{"1":"2024-11-01T10:00:00Z","2":"2024-11-02T11:00:00Z"}',
      event: {
        title: "Multi Day Event",
        date: "2024-11-01",
        endDate: "2024-11-03",
      },
    },
  },
];

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}:`);

  const { getScannedTicketsData, isTicketScanned, areAllTicketsScanned } =
    testTicketDisplay(testCase.booking);

  const scannedData = getScannedTicketsData();
  const allScanned = areAllTicketsScanned();
  const totalTickets = testCase.booking.tickets || 1;

  console.log(`   - Total tickets: ${totalTickets}`);
  console.log(`   - Scanned tickets: ${Object.keys(scannedData).length}`);
  console.log(`   - Show "All Tickets Used": ${allScanned ? "YES" : "NO"}`);
  console.log(
    `   - Display mode: ${
      allScanned ? "Completion Message" : "Individual Status"
    }`
  );

  if (!allScanned) {
    for (let i = 1; i <= totalTickets; i++) {
      const scanned = isTicketScanned(i);
      console.log(
        `     - Ticket ${i}: ${scanned ? "✅ Thank You" : "📱 QR Code"}`
      );
    }
  }
});

console.log("\n🎯 Expected Results:");
console.log("1. Single-day events should ALWAYS show individual status");
console.log(
  "2. Multi-day events should show completion message when all tickets used"
);
console.log("3. No more 'All Tickets Used' for single tickets!");
