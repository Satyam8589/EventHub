// Simple test to check event data via API endpoint
console.log("🔍 TESTING EVENT API ENDPOINT");
console.log("=============================\n");

const http = require("http");

// Test function to make API call
function testEventAPI(eventId = "1") {
  console.log(`📞 Testing API: /api/events/${eventId}`);

  const options = {
    hostname: "localhost",
    port: 3000,
    path: `/api/events/${eventId}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const responseData = JSON.parse(data);
        console.log("\n✅ API Response received:");
        console.log("Status:", res.statusCode);

        if (responseData.event) {
          const event = responseData.event;
          console.log("\n📋 Event Time Fields:");
          console.log("=".repeat(30));
          console.log("🆔 ID:", event.id);
          console.log("📝 Title:", event.title);
          console.log("⏰ Start Time (time):", event.time || "Not set");
          console.log("🏁 End Time (endtime):", event.endtime || "Not set");
          console.log("🏁 End Time (endTime):", event.endTime || "Not set");
          console.log("📅 End Date (enddate):", event.enddate || "Not set");
          console.log("📅 End Date (endDate):", event.endDate || "Not set");

          console.log("\n🔍 Full event object keys:");
          console.log(Object.keys(event).sort());

          // Check if endtime exists but is null/empty
          if ("endtime" in event) {
            console.log("\n✅ endtime field exists in response");
            console.log("   Value:", JSON.stringify(event.endtime));
            console.log("   Type:", typeof event.endtime);
            console.log("   Is null?", event.endtime === null);
            console.log("   Is empty string?", event.endtime === "");
          } else {
            console.log("\n❌ endtime field does NOT exist in response");
          }
        } else {
          console.log("\n❌ No event data in response");
          console.log("Response:", responseData);
        }
      } catch (error) {
        console.error("\n❌ Error parsing response:", error);
        console.log("Raw response:", data);
      }
    });
  });

  req.on("error", (error) => {
    console.error("❌ Request error:", error.message);
    console.log("\n💡 Make sure the development server is running:");
    console.log("   npm run dev");
  });

  req.end();
}

// Test with a couple of different event IDs
console.log("🚀 Starting tests...");
testEventAPI("1");

setTimeout(() => {
  console.log("\n" + "=".repeat(50));
  testEventAPI("2");
}, 1000);
