// Test the time formatting logic
console.log("🕐 TESTING TIME FORMATTING LOGIC");
console.log("================================\n");

function formatTime(timeValue) {
  console.log(`📥 Input: "${timeValue}"`);
  console.log(`📋 Type: ${typeof timeValue}`);

  if (timeValue) {
    // If time is already formatted with AM/PM, use it directly
    if (timeValue.includes("AM") || timeValue.includes("PM")) {
      console.log("✅ Already has AM/PM format");
      return timeValue;
    }

    // If time is in 24-hour format (HH:MM), convert to 12-hour with AM/PM
    const timeParts = timeValue.split(":");
    console.log(`📋 Time parts: [${timeParts.join(", ")}]`);

    if (timeParts.length >= 2) {
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const result = `${hours}:${minutes} ${ampm}`;
      console.log(`✅ Converted to: "${result}"`);
      return result;
    }
  }

  console.log("❌ Could not format, using fallback");
  return "End time not specified";
}

// Test with the actual database value
console.log("🧪 Test 1: Database value");
formatTime("07:01:00");

console.log("\n" + "=".repeat(40));
console.log("🧪 Test 2: Standard format");
formatTime("14:30");

console.log("\n" + "=".repeat(40));
console.log("🧪 Test 3: Already formatted");
formatTime("2:30 PM");

console.log("\n" + "=".repeat(40));
console.log("🧪 Test 4: Empty/null values");
formatTime("");
formatTime(null);
formatTime(undefined);
