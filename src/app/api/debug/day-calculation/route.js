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
          <title>Day Calculation Debug</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .form { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            input, button { padding: 10px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #007cba; color: white; cursor: pointer; }
            button:hover { background: #005a87; }
            .debug-info { background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 10px 0; }
            pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🕒 Day Calculation Debug</h1>
            <div class="form">
              <h3>Check Day Calculation for Event</h3>
              <input type="text" id="eventId" placeholder="Enter Event ID" style="width: 300px;">
              <button onclick="checkDayCalculation()">Check Day Calculation</button>
            </div>
            
            <div id="results"></div>
            
            <script>
              function checkDayCalculation() {
                const eventId = document.getElementById('eventId').value;
                if (!eventId) {
                  alert('Please enter an event ID');
                  return;
                }
                window.location.href = '/api/debug/day-calculation?eventId=' + eventId;
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
        <!DOCTYPE html>
        <html>
        <head>
          <title>Day Calculation Debug</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .error { background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🕒 Day Calculation Debug</h1>
            <div class="error">
              <h3>Error</h3>
              <p>Event not found: ${eventId}</p>
              <p>Error: ${error?.message || "Unknown error"}</p>
            </div>
            <a href="/api/debug/day-calculation">← Back</a>
          </div>
        </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Calculate day information
    const eventStartDate = new Date(event.date);
    const eventEndDate = new Date(event.end_date);
    const currentDate = new Date();

    // Reset time to midnight for accurate day calculation
    const eventStartMidnight = new Date(eventStartDate);
    eventStartMidnight.setHours(0, 0, 0, 0);

    const currentMidnight = new Date(currentDate);
    currentMidnight.setHours(0, 0, 0, 0);

    const daysDifference = Math.floor(
      (currentMidnight - eventStartMidnight) / (1000 * 60 * 60 * 24)
    );
    const currentEventDay = daysDifference + 1; // Day 1, 2, 3, etc.

    // Calculate total event days
    const eventEndMidnight = new Date(eventEndDate);
    eventEndMidnight.setHours(0, 0, 0, 0);

    const totalEventDays =
      Math.floor(
        (eventEndMidnight - eventStartMidnight) / (1000 * 60 * 60 * 24)
      ) + 1;

    // Test QR day validation
    let qrTestResults = [];
    for (let day = 1; day <= totalEventDays + 2; day++) {
      const isValidDay = day === currentEventDay;
      const message =
        day < currentEventDay
          ? `Past day (Day ${day} has already passed. Today is Day ${currentEventDay})`
          : day > currentEventDay
          ? `Future day (Day ${day} is in the future. Today is Day ${currentEventDay})`
          : `Current day (This is today - Day ${currentEventDay})`;

      qrTestResults.push({
        day,
        isValidDay,
        message,
      });
    }

    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Day Calculation Debug</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 1000px; margin: 0 auto; }
          h1 { color: #333; }
          .section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .current-day { background: #e8f5e8; color: #2e7d32; padding: 10px; border-radius: 4px; margin: 10px 0; }
          .past-day { background: #ffebee; color: #c62828; padding: 10px; border-radius: 4px; margin: 10px 0; }
          .future-day { background: #e3f2fd; color: #1565c0; padding: 10px; border-radius: 4px; margin: 10px 0; }
          pre { background: #f0f0f0; padding: 15px; border-radius: 4px; overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .valid { background: #e8f5e8; }
          .invalid { background: #ffebee; }
          .btn { background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🕒 Day Calculation Debug - Event ${eventId}</h1>
          
          <div class="section">
            <h2>📅 Event Information</h2>
            <p><strong>Title:</strong> ${event.title}</p>
            <p><strong>Start Date:</strong> ${eventStartDate.toISOString()}</p>
            <p><strong>End Date:</strong> ${eventEndDate.toISOString()}</p>
            <p><strong>Total Event Days:</strong> ${totalEventDays}</p>
          </div>

          <div class="section">
            <h2>🕐 Current Date Calculation</h2>
            <p><strong>Current Date/Time:</strong> ${currentDate.toISOString()}</p>
            <p><strong>Current Date (Midnight):</strong> ${currentMidnight.toISOString()}</p>
            <p><strong>Event Start (Midnight):</strong> ${eventStartMidnight.toISOString()}</p>
            <p><strong>Days Difference:</strong> ${daysDifference}</p>
            <div class="current-day">
              <h3>📍 Current Event Day: ${currentEventDay}</h3>
            </div>
          </div>

          <div class="section">
            <h2>🎫 QR Day Validation Test</h2>
            <table>
              <thead>
                <tr>
                  <th>QR Day</th>
                  <th>Status</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                ${qrTestResults
                  .map(
                    (result) => `
                  <tr class="${result.isValidDay ? "valid" : "invalid"}">
                    <td>Day ${result.day}</td>
                    <td>${result.isValidDay ? "✅ Valid" : "❌ Invalid"}</td>
                    <td>${result.message}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>🔍 Raw Calculation Details</h2>
            <pre>${JSON.stringify(
              {
                eventStartDate: eventStartDate.toISOString(),
                eventEndDate: eventEndDate.toISOString(),
                currentDate: currentDate.toISOString(),
                eventStartMidnight: eventStartMidnight.toISOString(),
                currentMidnight: currentMidnight.toISOString(),
                daysDifferenceMs: currentMidnight - eventStartMidnight,
                daysDifference: daysDifference,
                currentEventDay: currentEventDay,
                totalEventDays: totalEventDays,
                calculationFormula:
                  "currentEventDay = Math.floor((currentMidnight - eventStartMidnight) / (1000 * 60 * 60 * 24)) + 1",
              },
              null,
              2
            )}</pre>
          </div>

          <a href="/api/debug/day-calculation" class="btn">← Back</a>
        </div>
      </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("Day calculation debug error:", error);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Day Calculation Debug</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          .error { background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🕒 Day Calculation Debug</h1>
          <div class="error">
            <h3>Error</h3>
            <p>${error.message}</p>
            <pre>${error.stack}</pre>
          </div>
          <a href="/api/debug/day-calculation">← Back</a>
        </div>
      </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
