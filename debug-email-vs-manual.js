// Debug script to check event date calculation differences between email and manual download
// Run this in browser console

async function debugEventDayCalculation() {
  console.log("🔍 DEBUGGING EVENT DAY CALCULATION DIFFERENCES");
  console.log("================================================\n");

  try {
    // 1. Get the booking data from the email API path
    console.log("1️⃣ Fetching booking data via email API path...");

    const bookingId = "28c3bfe1-1ab3-4494-aa43-dda7c6bbe94f"; // Use your actual booking ID

    // Simulate the API call that the email system makes
    const emailResponse = await fetch(`/api/bookings`);
    const emailBookingsData = await emailResponse.json();

    const emailBooking = emailBookingsData.bookings.find(
      (b) => b.id === bookingId
    );

    if (emailBooking) {
      console.log("📧 EMAIL PATH - Event data:", {
        eventId: emailBooking.event?.id,
        eventTitle: emailBooking.event?.title,
        date: emailBooking.event?.date,
        endDate: emailBooking.event?.endDate,
        enddate: emailBooking.event?.enddate,
        eventKeys: Object.keys(emailBooking.event || {}),
        rawEventData: emailBooking.event,
      });

      // Manual calculation like in generateTicketImage
      const startDate = new Date(emailBooking.event.date);
      const endDate =
        emailBooking.event.endDate || emailBooking.event.enddate
          ? new Date(emailBooking.event.endDate || emailBooking.event.enddate)
          : null;

      console.log("📧 EMAIL PATH - Date calculation:", {
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : null,
        startDateMs: startDate.getTime(),
        endDateMs: endDate ? endDate.getTime() : null,
      });

      if (endDate) {
        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        const finalDays = Math.max(1, daysDiff);

        console.log("📧 EMAIL PATH - Calculation result:", {
          timeDiffMs: timeDiff,
          timeDiffDays: timeDiff / (1000 * 3600 * 24),
          daysDiff: daysDiff,
          finalDays: finalDays,
        });
      }
    }

    // 2. Check the event data directly from events API
    console.log("\n2️⃣ Fetching event data directly...");
    if (emailBooking?.event?.id) {
      const eventResponse = await fetch(`/api/events/${emailBooking.event.id}`);
      if (eventResponse.ok) {
        const eventData = await eventResponse.json();

        console.log("🎯 DIRECT EVENT - Event data:", {
          eventId: eventData.id,
          eventTitle: eventData.title,
          date: eventData.date,
          endDate: eventData.endDate,
          enddate: eventData.enddate,
          eventKeys: Object.keys(eventData),
          rawEventData: eventData,
        });

        // Manual calculation
        const startDate = new Date(eventData.date);
        const endDate =
          eventData.endDate || eventData.enddate
            ? new Date(eventData.endDate || eventData.enddate)
            : null;

        console.log("🎯 DIRECT EVENT - Date calculation:", {
          startDate: startDate.toISOString(),
          endDate: endDate ? endDate.toISOString() : null,
          startDateMs: startDate.getTime(),
          endDateMs: endDate ? endDate.getTime() : null,
        });

        if (endDate) {
          const timeDiff = endDate.getTime() - startDate.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
          const finalDays = Math.max(1, daysDiff);

          console.log("🎯 DIRECT EVENT - Calculation result:", {
            timeDiffMs: timeDiff,
            timeDiffDays: timeDiff / (1000 * 3600 * 24),
            daysDiff: daysDiff,
            finalDays: finalDays,
          });
        }
      }
    }

    // 3. Test the actual email generation
    console.log("\n3️⃣ Testing actual email ticket generation...");
    console.log("This will help us see what the email API generates...");
  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

// Run the debug
debugEventDayCalculation();
