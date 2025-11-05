// Debug the event data being passed to generateTicketImage
async function debugEventData() {
  console.log("🔍 DEBUGGING EVENT DATA FOR EMAIL GENERATION");
  console.log("=============================================\n");

  try {
    // Test the send-ticket-email API to see what data it's getting
    const bookingId = "28c3bfe1-1ab3-4494-aa43-dda7c6bbe94f";

    // First, check what the bookings API returns
    console.log("1️⃣ Checking bookings API data...");
    const bookingsResponse = await fetch("/api/bookings");
    const bookingsData = await bookingsResponse.json();

    const booking = bookingsData.bookings.find((b) => b.id === bookingId);
    if (booking) {
      console.log("📋 BOOKING DATA:");
      console.log("- Booking ID:", booking.id);
      console.log("- Event ID:", booking.event?.id);
      console.log("- Event Title:", booking.event?.title);
      console.log("- Event Date:", booking.event?.date);
      console.log("- Event End Date:", booking.event?.endDate);
      console.log("- Event End date:", booking.event?.enddate);
      console.log("- All Event Keys:", Object.keys(booking.event || {}));
      console.log("- Raw Event Data:", booking.event);

      // Test the calculateEventDays logic manually
      console.log("\n2️⃣ TESTING EVENT DAYS CALCULATION:");

      const startDate = new Date(booking.event.date);
      const endDateValue = booking.event.endDate || booking.event.enddate;

      console.log("- Start Date:", startDate.toISOString());
      console.log("- End Date Value:", endDateValue);

      if (!endDateValue) {
        console.log(
          "❌ NO END DATE FOUND - This explains single day detection!"
        );
        console.log("💡 Check if endDate/enddate exists in database");
      } else {
        const endDate = new Date(endDateValue);
        console.log("- End Date Parsed:", endDate.toISOString());

        // Manual day calculation
        const days = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          days.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log("- Calculated Days:", days.length);
        console.log(
          "- Days Array:",
          days.map((d) => d.toDateString())
        );
      }
    }

    // 3. Check the event directly from events API
    console.log("\n3️⃣ Checking event data directly...");
    if (booking?.event?.id) {
      const eventResponse = await fetch(`/api/events/${booking.event.id}`);
      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        console.log("🎯 DIRECT EVENT API DATA:");
        console.log("- Event ID:", eventData.id);
        console.log("- Event Title:", eventData.title);
        console.log("- Event Date:", eventData.date);
        console.log("- Event End Date:", eventData.endDate);
        console.log("- Event End date:", eventData.enddate);
        console.log("- All Keys:", Object.keys(eventData));
        console.log("- Raw Data:", eventData);
      }
    }
  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

// Run the debug
debugEventData();
