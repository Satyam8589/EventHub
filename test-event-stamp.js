// Test script for Event Completed Stamp
// Run this in the browser console on the My Events page

console.log("🧪 Testing Event Completed Stamp Functionality");

// Test 1: Check if Past Events tab exists and works
function testPastEventsTab() {
  console.log("📋 Testing Past Events Tab");

  const pastTab = Array.from(document.querySelectorAll("button")).find((btn) =>
    btn.textContent.includes("Past Events")
  );

  if (pastTab) {
    console.log("✅ Past Events tab found:", pastTab.textContent.trim());

    // Click the tab to see the stamps
    pastTab.click();

    setTimeout(() => {
      // Check for stamps after tab switch
      testEventStamps();
    }, 500);
  } else {
    console.log("❌ Past Events tab not found");
  }
}

// Test 2: Check for Event Completed stamps
function testEventStamps() {
  console.log("🏷️ Testing Event Completed Stamps");

  // Look for stamp elements
  const stamps = document.querySelectorAll(
    '[class*="w-24"][class*="h-24"][class*="rounded-full"]'
  );
  console.log(`Found ${stamps.length} potential event stamps`);

  stamps.forEach((stamp, index) => {
    const stampText = stamp.textContent.trim();
    console.log(`Stamp ${index + 1}:`, {
      text: stampText,
      hasEventText: stampText.includes("EVENT"),
      hasCompletedText: stampText.includes("COMPLETED"),
      classes: stamp.className,
    });
  });

  // Check for absence of buttons in past events
  const viewTicketButtons = Array.from(
    document.querySelectorAll("button")
  ).filter((btn) => btn.textContent.includes("View Ticket"));

  const emailButtons = Array.from(document.querySelectorAll("button")).filter(
    (btn) => btn.textContent.includes("Send Ticket")
  );

  console.log("🔍 Button Removal Check:");
  console.log(
    `- View Ticket buttons: ${viewTicketButtons.length} (should be 0 for past events)`
  );
  console.log(
    `- Email buttons: ${emailButtons.length} (should be 0 for past events)`
  );

  if (viewTicketButtons.length === 0 && emailButtons.length === 0) {
    console.log("✅ All action buttons successfully removed from past events");
  } else {
    console.log("⚠️ Some action buttons still present in past events");
  }
}

// Test 3: Check stamp design elements
function testStampDesign() {
  console.log("🎨 Testing Stamp Design Elements");

  // Check for circular stamp elements
  const circles = document.querySelectorAll('[class*="rounded-full"]');
  const gradients = document.querySelectorAll('[class*="bg-gradient"]');
  const checkmarks = document.querySelectorAll('svg path[d*="M5 13l4 4L19 7"]');

  console.log("Design Elements Found:");
  console.log(`- Circular elements: ${circles.length}`);
  console.log(`- Gradient backgrounds: ${gradients.length}`);
  console.log(`- Checkmark icons: ${checkmarks.length}`);

  // Check for decorative dots
  const decorativeDots = document.querySelectorAll(
    '[class*="w-1"][class*="h-1"][class*="rounded-full"]'
  );
  console.log(`- Decorative dots: ${decorativeDots.length}`);

  // Check for date stamps
  const dateStamps = document.querySelectorAll('[class*="font-mono"]');
  console.log(`- Date stamps: ${dateStamps.length}`);
}

// Test 4: Test tab switching behavior
function testTabSwitching() {
  console.log("🔄 Testing Tab Switching Behavior");

  const tabs = ["upcoming", "ongoing", "past"];
  let currentTest = 0;

  function testNextTab() {
    if (currentTest >= tabs.length) {
      console.log("✅ Tab switching test completed");
      return;
    }

    const tabName = tabs[currentTest];
    const tabButton = Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.textContent.toLowerCase().includes(tabName.toLowerCase())
    );

    if (tabButton) {
      console.log(`📑 Testing ${tabName} tab`);
      tabButton.click();

      setTimeout(() => {
        const hasStamps =
          document.querySelectorAll(
            '[class*="w-24"][class*="h-24"][class*="rounded-full"]'
          ).length > 0;
        const hasButtons = document.querySelectorAll("button").length > 3; // More than just tab buttons

        console.log(`${tabName} tab:`, {
          hasStamps,
          hasActionButtons: hasButtons,
          expected: tabName === "past" ? "stamps only" : "buttons only",
        });

        currentTest++;
        testNextTab();
      }, 300);
    } else {
      console.log(`❌ ${tabName} tab not found`);
      currentTest++;
      testNextTab();
    }
  }

  testNextTab();
}

// Run all tests
console.log("🚀 Running Event Completed Stamp Tests...");
console.log("");

// Start with the Past Events tab test
testPastEventsTab();

// Test stamp design elements
setTimeout(() => {
  testStampDesign();
}, 1000);

// Test tab switching
setTimeout(() => {
  testTabSwitching();
}, 2000);

console.log("");
console.log("💡 Manual Testing Instructions:");
console.log("1. Click on 'Past Events' tab");
console.log("2. Look for circular green stamps with 'EVENT COMPLETED' text");
console.log(
  "3. Verify no 'View Ticket', 'Details', or 'Send Email' buttons appear"
);
console.log("4. Check that stamps have rotation animation on hover");
console.log(
  "5. Verify date stamp appears in bottom-right corner of main stamp"
);

console.log("");
console.log("✨ Test script completed!");
