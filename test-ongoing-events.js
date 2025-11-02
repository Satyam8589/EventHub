// Test script for ongoing events functionality
// Run this in the browser console on the My Events page

console.log("🧪 Testing Ongoing Events Functionality");

// Test 1: Check if all three tabs exist
function testTabsExist() {
  const tabs = {
    upcoming: document.querySelector(
      'button[onclick*="setActiveTab(\\"upcoming\\")"]'
    ),
    ongoing: document.querySelector(
      'button[onclick*="setActiveTab(\\"ongoing\\")"]'
    ),
    past: document.querySelector('button[onclick*="setActiveTab(\\"past\\")"]'),
  };

  console.log("📋 Tab Buttons Test:");
  Object.entries(tabs).forEach(([name, button]) => {
    if (button) {
      console.log(
        `✅ ${name.charAt(0).toUpperCase() + name.slice(1)} tab: Found`
      );
      console.log(`   Text: "${button.textContent.trim()}"`);
    } else {
      console.log(
        `❌ ${name.charAt(0).toUpperCase() + name.slice(1)} tab: Missing`
      );
    }
  });
}

// Test 2: Test event categorization logic
function testEventCategorization() {
  const now = new Date();

  // Test cases for different event timings
  const testEvents = [
    {
      id: 1,
      name: "Past Event",
      date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], // 2 days ago
      time: "18:00",
      endDate: new Date(Date.now() - 86400000).toISOString().split("T")[0], // 1 day ago
      expectedCategory: "past",
    },
    {
      id: 2,
      name: "Ongoing Event",
      date: new Date(Date.now() - 3600000).toISOString().split("T")[0], // Started 1 hour ago
      time: new Date(Date.now() - 3600000).toTimeString().slice(0, 5), // 1 hour ago
      endDate: new Date(Date.now() + 3600000).toISOString().split("T")[0], // Ends in 1 hour
      expectedCategory: "ongoing",
    },
    {
      id: 3,
      name: "Future Event",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
      time: "18:00",
      expectedCategory: "upcoming",
    },
    {
      id: 4,
      name: "Single Day Event Today",
      date: new Date().toISOString().split("T")[0], // Today
      time: "23:59", // Late tonight (should be ongoing if current time < 23:59)
      expectedCategory: now.getHours() < 23 ? "ongoing" : "past",
    },
  ];

  console.log("🎯 Event Categorization Test:");
  console.log("Current time:", now.toLocaleString());

  testEvents.forEach((event) => {
    const eventStartDate = new Date(`${event.date}T${event.time || "00:00"}`);

    let eventEndDateTime;
    if (event.endDate) {
      eventEndDateTime = new Date(`${event.endDate}T${event.time || "23:59"}`);
    } else if (event.time) {
      eventEndDateTime = new Date(`${event.date}T${event.time}`);
    } else {
      eventEndDateTime = new Date(eventStartDate);
      eventEndDateTime.setHours(23, 59, 59, 999);
    }

    const isUpcoming = now < eventStartDate;
    const isOngoing = now >= eventStartDate && now <= eventEndDateTime;
    const isPast = now > eventEndDateTime;

    let actualCategory;
    if (isUpcoming) actualCategory = "upcoming";
    else if (isOngoing) actualCategory = "ongoing";
    else actualCategory = "past";

    const result = actualCategory === event.expectedCategory ? "✅" : "❌";

    console.log(`${result} ${event.name}:`);
    console.log(`   Start: ${eventStartDate.toLocaleString()}`);
    console.log(`   End: ${eventEndDateTime.toLocaleString()}`);
    console.log(
      `   Expected: ${event.expectedCategory}, Actual: ${actualCategory}`
    );
    console.log(
      `   Flags: upcoming=${isUpcoming}, ongoing=${isOngoing}, past=${isPast}`
    );
  });
}

// Test 3: Check if event badges are displayed correctly
function testEventBadges() {
  const badges = document.querySelectorAll(
    '[class*="bg-"][class*="text-white"]:not(button)'
  );
  const badgeTexts = Array.from(badges).map((badge) =>
    badge.textContent.trim()
  );

  console.log("🏷️ Event Badge Test:");
  console.log(`Found ${badges.length} potential event badges`);

  const expectedBadges = ["Upcoming", "Live Now", "Finished", "Event"];
  expectedBadges.forEach((expected) => {
    const found = badgeTexts.includes(expected);
    console.log(
      `${found ? "✅" : "⚠️"} "${expected}" badge: ${
        found ? "Found" : "Not found"
      }`
    );
  });

  // Show all badge texts found
  if (badgeTexts.length > 0) {
    console.log("All badge texts found:", badgeTexts);
  }
}

// Test 4: Test visual indicators for ongoing events
function testOngoingVisualIndicators() {
  console.log("🎨 Ongoing Event Visual Indicators Test:");

  // Check for animate-pulse class (Live Now badges)
  const pulseBadges = document.querySelectorAll(".animate-pulse");
  console.log(
    `Found ${pulseBadges.length} pulsing elements (should be Live Now badges)`
  );

  // Check for green gradient in ongoing tab
  const ongoingTab = Array.from(document.querySelectorAll("button")).find(
    (btn) => btn.textContent.includes("Ongoing")
  );

  if (ongoingTab) {
    const hasGreenGradient = ongoingTab.className.includes("from-green-500");
    console.log(
      `${
        hasGreenGradient ? "✅" : "❌"
      } Ongoing tab has green gradient: ${hasGreenGradient}`
    );
  } else {
    console.log("❌ Ongoing tab not found");
  }
}

// Run all tests
console.log("🚀 Running all tests...");
testTabsExist();
console.log("");
testEventCategorization();
console.log("");
testEventBadges();
console.log("");
testOngoingVisualIndicators();

console.log("");
console.log("✨ Test script completed. Check results above.");
console.log("💡 To test manually:");
console.log("1. Click the 'Ongoing' tab to see events currently happening");
console.log("2. Look for 'Live Now' badges with pulsing animation");
console.log("3. Verify events move between tabs as time progresses");
