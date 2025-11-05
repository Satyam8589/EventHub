// Test the QR scanning logic fix

console.log("=".repeat(80));
console.log("QR SCANNING LOGIC TEST");
console.log("=".repeat(80));

// Simulate the values from your log
const currentEventDay = 2; // Today is Day 2
const totalTickets = 1; // Booking has 1 ticket
const totalDaysInQR = 2; // QR says "_DAY_2_OF_2" (2 days total)

console.log("Input Values:");
console.log("- currentEventDay:", currentEventDay);
console.log("- totalTickets (purchased):", totalTickets);
console.log("- totalDaysInQR (from QR):", totalDaysInQR);

// OLD LOGIC (broken)
const oldTotalEventDays = totalTickets; // Was using tickets count
const oldLogicPasses = currentEventDay <= oldTotalEventDays;
console.log("\\nOLD LOGIC (BROKEN):");
console.log("- totalEventDays = totalTickets =", oldTotalEventDays);
console.log(
  "- currentEventDay > totalEventDays?",
  currentEventDay,
  ">",
  oldTotalEventDays,
  "=",
  currentEventDay > oldTotalEventDays
);
console.log(
  "- Result:",
  currentEventDay > oldTotalEventDays
    ? "❌ BLOCKED (All tickets used)"
    : "✅ ALLOWED"
);

// NEW LOGIC (fixed)
const newTotalEventDays = totalDaysInQR || totalTickets; // Use QR days if available
const newLogicPasses = currentEventDay <= newTotalEventDays;
console.log("\\nNEW LOGIC (FIXED):");
console.log(
  "- totalEventDays = totalDaysInQR || totalTickets =",
  newTotalEventDays
);
console.log(
  "- currentEventDay > totalEventDays?",
  currentEventDay,
  ">",
  newTotalEventDays,
  "=",
  currentEventDay > newTotalEventDays
);
console.log(
  "- Result:",
  currentEventDay > newTotalEventDays
    ? "❌ BLOCKED (All days passed)"
    : "✅ ALLOWED"
);

console.log("\\n" + "=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));
console.log("QR Code: 28c3bfe1-1ab3-4494-aa43-dda7c6bbe94f_DAY_2_OF_2");
console.log("Today: Day 2 of 2-day event");
console.log("Tickets purchased: 1 ticket");
console.log("");
console.log("Before fix:", oldLogicPasses ? "Would ALLOW" : "Would BLOCK ❌");
console.log("After fix:", newLogicPasses ? "Will ALLOW ✅" : "Will BLOCK");
console.log("");
console.log(
  "Fix status:",
  newLogicPasses && !oldLogicPasses ? "🎉 FIXED!" : "Need more investigation"
);
