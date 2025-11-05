export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Day 2 Ticket Timing Debug</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .form { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            input, button { padding: 10px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #007cba; color: white; cursor: pointer; }
            button:hover { background: #005a87; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎫 Day 2 Ticket Timing Debug</h1>
            <div class="form">
              <h3>Check When Day 2 Tickets Are Accepted</h3>
              <input type="text" id="eventId" placeholder="Enter Event ID" style="width: 300px;">
              <button onclick="checkTiming()">Check Day 2 Timing</button>
            </div>
            
            <script>
              function checkTiming() {
                const eventId = document.getElementById('eventId').value;
                if (!eventId) {
                  alert('Please enter an event ID');
                  return;
                }
                window.location.href = '/api/debug/day-timing?eventId=' + eventId;
              }
            </script>
          </div>
        </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Import Supabase
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the event
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !event) {
      return new Response(
        `
        <html><body>
          <h1>Error</h1>
          <p>Event not found: ${eventId}</p>
          <a href="/api/debug/day-timing">← Back</a>
        </body></html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Get event start date
    const eventStartDate = new Date(event.date);

    // Calculate Day 2 start time (exactly 24 hours after Day 1 starts)
    const day2StartTime = new Date(eventStartDate);
    day2StartTime.setDate(day2StartTime.getDate() + 1);
    day2StartTime.setHours(0, 0, 0, 0); // Midnight of Day 2

    // Calculate when Day 2 ends (before Day 3 starts)
    const day2EndTime = new Date(day2StartTime);
    day2EndTime.setDate(day2EndTime.getDate() + 1);
    day2EndTime.setHours(0, 0, 0, 0);
    day2EndTime.setMilliseconds(-1); // 23:59:59.999 of Day 2

    // Current time
    const now = new Date();

    // Check if we're currently in Day 2
    const isCurrentlyDay2 = now >= day2StartTime && now < day2EndTime;

    // Simulate the day calculation logic from scan-ticket
    const eventStartMidnight = new Date(eventStartDate);
    eventStartMidnight.setHours(0, 0, 0, 0);

    const currentMidnight = new Date(now);
    currentMidnight.setHours(0, 0, 0, 0);

    const daysDifference = Math.floor(
      (currentMidnight - eventStartMidnight) / (1000 * 60 * 60 * 24)
    );
    const currentEventDay = daysDifference + 1;

    // Test different times throughout Day 2
    const testTimes = [];
    for (let hour = 0; hour < 24; hour++) {
      const testTime = new Date(day2StartTime);
      testTime.setHours(hour, 0, 0, 0);

      // Simulate day calculation for this test time
      const testMidnight = new Date(testTime);
      testMidnight.setHours(0, 0, 0, 0);

      const testDaysDiff = Math.floor(
        (testMidnight - eventStartMidnight) / (1000 * 60 * 60 * 24)
      );
      const testEventDay = testDaysDiff + 1;

      testTimes.push({
        time: testTime.toLocaleString(),
        hour: hour,
        calculatedDay: testEventDay,
        isDay2Valid: testEventDay === 2,
      });
    }

    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Day 2 Ticket Timing Debug</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 1000px; margin: 0 auto; }
          h1 { color: #333; }
          .section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .current { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .timing { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .valid { background: #e8f5e8; }
          .invalid { background: #ffebee; }
          pre { background: #f0f0f0; padding: 15px; border-radius: 4px; overflow-x: auto; }
          .btn { background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎫 Day 2 Ticket Timing - Event ${eventId}</h1>
          
          <div class="section">
            <h2>📅 Event Information</h2>
            <p><strong>Event Title:</strong> ${event.title}</p>
            <p><strong>Event Start Date:</strong> ${eventStartDate.toLocaleString()}</p>
            <p><strong>Event Start (Midnight):</strong> ${eventStartMidnight.toLocaleString()}</p>
          </div>

          <div class="current">
            <h2>🕐 Current Status</h2>
            <p><strong>Current Time:</strong> ${now.toLocaleString()}</p>
            <p><strong>Current Event Day (Calculated):</strong> Day ${currentEventDay}</p>
            <p><strong>Is Currently Day 2?</strong> ${
              isCurrentlyDay2 ? "✅ YES" : "❌ NO"
            }</p>
            <p><strong>Day 2 QR Code Valid Now?</strong> ${
              currentEventDay === 2
                ? "✅ YES - Day 2 tickets accepted"
                : "❌ NO - Day 2 tickets rejected"
            }</p>
          </div>

          <div class="timing">
            <h2>⏰ Day 2 Acceptance Window</h2>
            <p><strong>Day 2 Starts:</strong> ${day2StartTime.toLocaleString()} (Midnight)</p>
            <p><strong>Day 2 Ends:</strong> ${day2EndTime.toLocaleString()} (Before midnight)</p>
            <p><strong>Duration:</strong> Exactly 24 hours (00:00:00 to 23:59:59)</p>
          </div>

          <div class="section">
            <h2>🕐 Hourly Test - When Day 2 Tickets Are Accepted</h2>
            <table>
              <thead>
                <tr>
                  <th>Time on Day 2</th>
                  <th>Calculated Day</th>
                  <th>Day 2 QR Valid?</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${testTimes
                  .map(
                    (test) => `
                  <tr class="${test.isDay2Valid ? "valid" : "invalid"}">
                    <td>${test.time}</td>
                    <td>Day ${test.calculatedDay}</td>
                    <td>${test.isDay2Valid ? "✅ YES" : "❌ NO"}</td>
                    <td>${
                      test.isDay2Valid
                        ? "Day 2 tickets ACCEPTED"
                        : "Day 2 tickets REJECTED"
                    }</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>📋 Summary</h2>
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px;">
              <h3>When Day 2 Tickets Are Accepted:</h3>
              <ul>
                <li><strong>Start Time:</strong> ${day2StartTime.toLocaleString()} (Midnight of Day 2)</li>
                <li><strong>End Time:</strong> ${day2EndTime.toLocaleString()} (Just before midnight of Day 3)</li>
                <li><strong>Duration:</strong> Exactly 24 hours</li>
                <li><strong>Logic:</strong> Day calculation resets at midnight each day</li>
              </ul>
              
              <h3>Current Situation:</h3>
              <p style="font-size: 18px; font-weight: bold; color: ${
                currentEventDay === 2 ? "#2e7d32" : "#c62828"
              };">
                ${
                  currentEventDay === 2
                    ? "✅ Day 2 tickets are currently ACCEPTED"
                    : `❌ Day 2 tickets are currently REJECTED (Today is Day ${currentEventDay})`
                }
              </p>
            </div>
          </div>

          <div class="section">
            <h2>🔍 Technical Details</h2>
            <pre>${JSON.stringify(
              {
                eventStartDate: eventStartDate.toISOString(),
                eventStartMidnight: eventStartMidnight.toISOString(),
                currentTime: now.toISOString(),
                currentMidnight: currentMidnight.toISOString(),
                daysDifference: daysDifference,
                currentEventDay: currentEventDay,
                day2StartTime: day2StartTime.toISOString(),
                day2EndTime: day2EndTime.toISOString(),
                calculationFormula:
                  "currentEventDay = Math.floor((currentMidnight - eventStartMidnight) / (1000 * 60 * 60 * 24)) + 1",
              },
              null,
              2
            )}</pre>
          </div>

          <a href="/api/debug/day-timing" class="btn">← Back</a>
        </div>
      </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("Day timing debug error:", error);
    return new Response(
      `
      <html><body>
        <h1>Error</h1>
        <p>${error.message}</p>
        <a href="/api/debug/day-timing">← Back</a>
      </body></html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
