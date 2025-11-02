// Test the fixed single-ticket logic
const testScenarios = [
  {
    name: "Single ticket on multi-day event (YOUR CASE)",
    booking: {
      tickets: 1,
      event: {
        title: "Serenity Symphony: A Two-Day Music & Wellness Retreat",
        date: "2025-11-02",
        endDate: "2025-11-03",
      },
    },
    scannedTickets: { 1: "2025-01-01T10:00:00.000Z" },
    expected: "Individual status (not completion message)",
  },
  {
    name: "Single ticket on single-day event",
    booking: {
      tickets: 1,
      event: {
        title: "Single Day Concert",
        date: "2025-11-02",
      },
    },
    scannedTickets: { 1: "2025-01-01T10:00:00.000Z" },
    expected: "Individual status (not completion message)",
  },
  {
    name: "Multiple tickets on multi-day event (all used)",
    booking: {
      tickets: 3,
      event: {
        title: "Three Day Festival",
        date: "2025-11-02",
        endDate: "2025-11-04",
      },
    },
    scannedTickets: { 1: "timestamp1", 2: "timestamp2", 3: "timestamp3" },
    expected: "All Tickets Used completion message",
  },
  {
    name: "Multiple tickets on multi-day event (partial)",
    booking: {
      tickets: 3,
      event: {
        title: "Three Day Festival",
        date: "2025-11-02",
        endDate: "2025-11-04",
      },
    },
    scannedTickets: { 1: "timestamp1", 2: "timestamp2" },
    expected: "Individual status (not completion message)",
  },
];

// Simulate the NEW fixed logic
function areAllTicketsScanned(booking, scannedTickets) {
  const totalTickets = booking.tickets || 1;
  const scannedCount = Object.keys(scannedTickets).length;

  // NEW LOGIC: If user has only 1 ticket, ALWAYS show individual status
  if (totalTickets === 1) {
    return false;
  }

  // For multi-ticket bookings, only show completion message when ALL tickets are used
  return scannedCount >= totalTickets;
}

console.log("🧪 Testing Fixed Single-Ticket Logic\n");

testScenarios.forEach((scenario, index) => {
  const result = areAllTicketsScanned(
    scenario.booking,
    scenario.scannedTickets
  );
  const willShowCompletion = result;
  const actualBehavior = willShowCompletion
    ? "Shows completion message"
    : "Shows individual status";
  const isCorrect =
    (willShowCompletion && scenario.expected.includes("completion")) ||
    (!willShowCompletion && scenario.expected.includes("Individual"));

  console.log(`${index + 1}. ${scenario.name}`);
  console.log(
    `   📊 Tickets: ${scenario.booking.tickets}, Scanned: ${
      Object.keys(scenario.scannedTickets).length
    }`
  );
  console.log(`   🎯 Expected: ${scenario.expected}`);
  console.log(`   ✨ Actual: ${actualBehavior}`);
  console.log(
    `   ${isCorrect ? "✅" : "❌"} ${isCorrect ? "CORRECT" : "WRONG"}\n`
  );
});

console.log(
  "🔍 Key Fix: Single tickets (totalTickets === 1) ALWAYS show individual status,"
);
console.log(
  "regardless of whether the event itself is multi-day or single-day!"
);
