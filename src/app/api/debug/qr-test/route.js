export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const qrCode = searchParams.get("qr");

  if (!qrCode) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code Test</title>
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
          <h1>🔍 QR Code Format Test</h1>
          <div class="form">
            <h3>Test QR Code Format and Day Calculation</h3>
            <input type="text" id="qrCode" placeholder="Enter QR Code" style="width: 400px;">
            <button onclick="testQR()">Test QR Code</button>
          </div>
          
          <script>
            function testQR() {
              const qrCode = document.getElementById('qrCode').value;
              if (!qrCode) {
                alert('Please enter a QR code');
                return;
              }
              window.location.href = '/api/debug/qr-test?qr=' + encodeURIComponent(qrCode);
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

  try {
    // Parse QR code format (same logic as scan-ticket)
    let bookingId = qrCode;
    let scannedDay = null;
    let totalTickets = null;

    // Check if this is a day-specific QR code
    const dayQRMatch = qrCode.match(/^(.+)_DAY_(\d+)_OF_(\d+)$/);
    if (dayQRMatch) {
      bookingId = dayQRMatch[1];
      scannedDay = parseInt(dayQRMatch[2]);
      totalTickets = parseInt(dayQRMatch[3]);
    }

    // Get current date calculation (same as scan-ticket)
    const eventId = "0fbb5e44-4057-4e04-8258-751ad39f30a4";

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
      throw new Error("Event not found");
    }

    // Calculate which day of the event it is (same logic as scan-ticket)
    const eventStartDate = new Date(event.date);
    const currentDate = new Date();

    // Reset time to midnight for accurate day calculation
    eventStartDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const daysDifference = Math.floor(
      (currentDate - eventStartDate) / (1000 * 60 * 60 * 24)
    );
    const currentEventDay = daysDifference + 1; // Day 1, 2, 3, etc.

    // Validation result
    const isValidDay = scannedDay === null || scannedDay === currentEventDay;
    let validationMessage = "";

    if (scannedDay !== null && scannedDay !== currentEventDay) {
      validationMessage =
        scannedDay < currentEventDay
          ? `This QR code was for Day ${scannedDay} which has already passed. Please use today's QR code (Day ${currentEventDay}).`
          : `This QR code is for Day ${scannedDay} but today is Day ${currentEventDay}. Please come back on the correct day.`;
    } else if (scannedDay === currentEventDay) {
      validationMessage = `✅ Valid! This is a Day ${scannedDay} QR code and today is Day ${currentEventDay}.`;
    } else {
      validationMessage = `✅ Valid! This is a general QR code (no specific day).`;
    }

    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code Test Results</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 1000px; margin: 0 auto; }
          h1 { color: #333; }
          .section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .valid { background: #e8f5e8; color: #2e7d32; padding: 15px; border-radius: 8px; }
          .invalid { background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; }
          pre { background: #f0f0f0; padding: 15px; border-radius: 4px; overflow-x: auto; }
          .btn { background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔍 QR Code Test Results</h1>
          
          <div class="section">
            <h2>📱 QR Code Analysis</h2>
            <table>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>Original QR Code</td>
                <td><code>${qrCode}</code></td>
              </tr>
              <tr>
                <td>Booking ID</td>
                <td><code>${bookingId}</code></td>
              </tr>
              <tr>
                <td>Is Day-Specific?</td>
                <td>${
                  scannedDay !== null ? "✅ YES" : "❌ NO (General QR)"
                }</td>
              </tr>
              <tr>
                <td>QR Day Number</td>
                <td>${scannedDay !== null ? `Day ${scannedDay}` : "N/A"}</td>
              </tr>
              <tr>
                <td>Total Tickets</td>
                <td>${totalTickets !== null ? totalTickets : "N/A"}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>📅 Day Calculation</h2>
            <table>
              <tr>
                <th>Property</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>Event Start Date</td>
                <td>${new Date(event.date).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Current Date</td>
                <td>${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td>Days Difference</td>
                <td>${daysDifference}</td>
              </tr>
              <tr>
                <td>Current Event Day</td>
                <td><strong>Day ${currentEventDay}</strong></td>
              </tr>
            </table>
          </div>

          <div class="${isValidDay ? "valid" : "invalid"}">
            <h2>🎫 Validation Result</h2>
            <h3>${isValidDay ? "✅ VALID" : "❌ INVALID"}</h3>
            <p>${validationMessage}</p>
          </div>

          <div class="section">
            <h2>🔍 Raw Data</h2>
            <pre>${JSON.stringify(
              {
                qrCode: qrCode,
                bookingId: bookingId,
                scannedDay: scannedDay,
                totalTickets: totalTickets,
                currentEventDay: currentEventDay,
                isValidDay: isValidDay,
                eventStartDate: event.date,
                currentDate: new Date().toISOString(),
                daysDifference: daysDifference,
                regexMatch: dayQRMatch,
              },
              null,
              2
            )}</pre>
          </div>

          <a href="/api/debug/qr-test" class="btn">← Test Another QR Code</a>
        </div>
      </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("QR test error:", error);
    return new Response(
      `
      <html><body>
        <h1>Error</h1>
        <p>${error.message}</p>
        <a href="/api/debug/qr-test">← Back</a>
      </body></html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}
