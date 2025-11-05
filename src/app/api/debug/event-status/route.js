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
          <title>Event Status Debug</title>
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
            <h1>🕐 Event Status Debug</h1>
            <div class="form">
              <h3>Check Event Status (Upcoming/Ongoing/Past)</h3>
              <input type="text" id="eventId" placeholder="Enter Event ID" style="width: 400px;">
              <button onclick="checkStatus()">Check Status</button>
            </div>
            
            <script>
              function checkStatus() {
                const eventId = document.getElementById('eventId').value;
                if (!eventId) {
                  alert('Please enter an event ID');
                  return;
                }
                window.location.href = '/api/debug/event-status?eventId=' + encodeURIComponent(eventId);
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
      "https://wasrwhlzzmxqwiwwxtxe.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3J3aGx6em14cXdpd3d4dHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjM0MzQsImV4cCI6MjA3NjgzOTQzNH0.WIzDWe8LIjmk21lZuVBWlFp6Dusoj5pDpF42sz1MYfk"
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
          <a href="/api/debug/event-status">← Back</a>
        </body></html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Reproduce the exact same logic as my-events page
    const now = new Date();
    const eventStartDate = new Date(event.date);

    let eventEndDateTime;
    if (event.end_date) {
      // Event has an end date/time
      eventEndDateTime = new Date(event.end_date);
    } else {
      // No end date, create end time from start date + time
      if (event.time) {
        // If event has a specific time, use that date with time
        eventEndDateTime = new Date(`${event.date}T${event.time}`);

        // Validate combined date/time
        if (isNaN(eventEndDateTime.getTime())) {
          // Fall back to end of day
          eventEndDateTime = new Date(eventStartDate);
          eventEndDateTime.setHours(23, 59, 59, 999);
        }
      } else {
        // If no specific time, assume event ends at end of day
        eventEndDateTime = new Date(eventStartDate);
        eventEndDateTime.setHours(23, 59, 59, 999);
      }
    }

    // Determine event status
    const isUpcoming = now < eventStartDate;
    const isOngoing = now >= eventStartDate && now <= eventEndDateTime;
    const isPast = now > eventEndDateTime;

    // Calculate time differences
    const timeDiff = {
      toStart: eventStartDate - now,
      toEnd: eventEndDateTime - now,
      fromStart: now - eventStartDate,
      fromEnd: now - eventEndDateTime,
    };

    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Event Status Debug Results</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 1000px; margin: 0 auto; }
          h1 { color: #333; }
          .section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .upcoming { background: #e3f2fd; color: #1565c0; padding: 15px; border-radius: 8px; }
          .ongoing { background: #e8f5e8; color: #2e7d32; padding: 15px; border-radius: 8px; }
          .past { background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; }
          pre { background: #f0f0f0; padding: 15px; border-radius: 4px; overflow-x: auto; }
          .btn { background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .time-info { background: #fff3e0; padding: 15px; border-radius: 8px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🕐 Event Status Debug - ${event.title}</h1>
          
          <div class="section">
            <h2>📅 Event Information</h2>
            <table>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>Event ID</td>
                <td>${event.id}</td>
              </tr>
              <tr>
                <td>Title</td>
                <td>${event.title}</td>
              </tr>
              <tr>
                <td>Start Date (Raw)</td>
                <td>${event.date}</td>
              </tr>
              <tr>
                <td>Start Date (Parsed)</td>
                <td>${eventStartDate.toLocaleString()}</td>
              </tr>
              <tr>
                <td>End Date (Raw)</td>
                <td>${event.end_date || "Not set"}</td>
              </tr>
              <tr>
                <td>End Date/Time (Calculated)</td>
                <td>${eventEndDateTime.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Time</td>
                <td>${event.time || "Not set"}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>🕐 Current Status</h2>
            <p><strong>Current Time:</strong> ${now.toLocaleString()}</p>
            
            <div class="${
              isUpcoming ? "upcoming" : isOngoing ? "ongoing" : "past"
            }">
              <h3>📍 Event Status: ${
                isUpcoming
                  ? "🔜 UPCOMING"
                  : isOngoing
                  ? "▶️ ONGOING"
                  : "✅ PAST"
              }</h3>
              <p><strong>In My Events Section:</strong> ${
                isPast
                  ? "Past Events"
                  : isOngoing
                  ? "Ongoing Events"
                  : "Upcoming Events"
              }</p>
            </div>
          </div>

          <div class="time-info">
            <h2>⏰ Time Analysis</h2>
            <table>
              <tr>
                <th>Condition</th>
                <th>Result</th>
                <th>Time Difference</th>
              </tr>
              <tr>
                <td>Is Upcoming (now < start)</td>
                <td>${isUpcoming ? "✅ YES" : "❌ NO"}</td>
                <td>${
                  timeDiff.toStart > 0
                    ? `Starts in ${Math.round(
                        timeDiff.toStart / (1000 * 60)
                      )} minutes`
                    : `Started ${Math.round(
                        -timeDiff.toStart / (1000 * 60)
                      )} minutes ago`
                }</td>
              </tr>
              <tr>
                <td>Is Ongoing (start ≤ now ≤ end)</td>
                <td>${isOngoing ? "✅ YES" : "❌ NO"}</td>
                <td>${
                  timeDiff.toEnd > 0
                    ? `Ends in ${Math.round(
                        timeDiff.toEnd / (1000 * 60)
                      )} minutes`
                    : `Ended ${Math.round(
                        -timeDiff.toEnd / (1000 * 60)
                      )} minutes ago`
                }</td>
              </tr>
              <tr>
                <td>Is Past (now > end)</td>
                <td>${isPast ? "✅ YES" : "❌ NO"}</td>
                <td>${
                  timeDiff.fromEnd > 0
                    ? `Ended ${Math.round(
                        timeDiff.fromEnd / (1000 * 60)
                      )} minutes ago`
                    : `Ends in ${Math.round(
                        -timeDiff.fromEnd / (1000 * 60)
                      )} minutes`
                }</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>🔍 Logic Explanation</h2>
            <h3>When Events Move to Past:</h3>
            <ul>
              <li><strong>Condition:</strong> <code>now > eventEndDateTime</code></li>
              <li><strong>Current Time:</strong> ${now.toISOString()}</li>
              <li><strong>Event End:</strong> ${eventEndDateTime.toISOString()}</li>
              <li><strong>Comparison:</strong> ${now.toISOString()} > ${eventEndDateTime.toISOString()} = ${isPast}</li>
            </ul>
            
            <h3>End Date/Time Calculation:</h3>
            <ul>
              <li>If <code>end_date</code> exists: Use <code>end_date</code></li>
              <li>If no <code>end_date</code> but <code>time</code> exists: Use <code>date + time</code></li>
              <li>If neither: Use <code>date + 23:59:59</code> (end of day)</li>
            </ul>
          </div>

          <div class="section">
            <h2>🔍 Raw Data</h2>
            <pre>${JSON.stringify(
              {
                event: {
                  id: event.id,
                  title: event.title,
                  date: event.date,
                  end_date: event.end_date,
                  time: event.time,
                },
                calculations: {
                  now: now.toISOString(),
                  eventStartDate: eventStartDate.toISOString(),
                  eventEndDateTime: eventEndDateTime.toISOString(),
                  isUpcoming,
                  isOngoing,
                  isPast,
                  timeDifferences: {
                    toStartMs: timeDiff.toStart,
                    toEndMs: timeDiff.toEnd,
                    fromStartMs: timeDiff.fromStart,
                    fromEndMs: timeDiff.fromEnd,
                  },
                },
              },
              null,
              2
            )}</pre>
          </div>

          <a href="/api/debug/event-status" class="btn">← Check Another Event</a>
        </div>
      </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("Event status debug error:", error);
    return new Response(
      `
      <html><body>
        <h1>Error</h1>
        <p>${error.message}</p>
        <a href="/api/debug/event-status">← Back</a>
      </body></html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
