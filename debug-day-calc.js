const { createClient } = require("@supabase/supabase-js");

async function checkEventDayCalculation() {
  const supabase = createClient(
    "https://wasrwhlzzmxqwiwwxtxe.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3J3aGx6em14cXdpd3d4dHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjM0MzQsImV4cCI6MjA3NjgzOTQzNH0.WIzDWe8LIjmk21lZuVBWlFp6Dusoj5pDpF42sz1MYfk"
  );

  const eventId = "0fbb5e44-4057-4e04-8258-751ad39f30a4";

  try {
    // Get the event
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      return;
    }

    if (!event) {
      console.log("Event not found");
      return;
    }

    console.log("=".repeat(60));
    console.log("EVENT DETAILS");
    console.log("=".repeat(60));
    console.log("Event ID:", event.id);
    console.log("Title:", event.title);
    console.log("Start Date:", event.date);
    console.log("End Date:", event.end_date);
    console.log("Category:", event.category);

    // Calculate day information (same logic as scan-ticket)
    const eventStartDate = new Date(event.date);
    const currentDate = new Date(); // November 5, 2025

    // Reset time to midnight for accurate day calculation
    eventStartDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const daysDifference = Math.floor(
      (currentDate - eventStartDate) / (1000 * 60 * 60 * 24)
    );
    const currentEventDay = daysDifference + 1; // Day 1, 2, 3, etc.

    console.log("\\n" + "=".repeat(60));
    console.log("DAY CALCULATION");
    console.log("=".repeat(60));
    console.log(
      "Event Start Date (original):",
      new Date(event.date).toISOString()
    );
    console.log("Event Start Date (midnight):", eventStartDate.toISOString());
    console.log("Current Date (now):", new Date().toISOString());
    console.log("Current Date (midnight):", currentDate.toISOString());
    console.log("Days Difference:", daysDifference);
    console.log("Current Event Day:", currentEventDay);

    // Test Day 2 validation
    console.log("\\n" + "=".repeat(60));
    console.log("DAY 2 QR VALIDATION TEST");
    console.log("=".repeat(60));

    const scannedDay = 2; // Simulating a Day 2 QR code
    console.log("QR Code Day:", scannedDay);
    console.log("Current Event Day:", currentEventDay);
    console.log(
      "Is QR Valid?",
      scannedDay === currentEventDay ? "YES ✅" : "NO ❌"
    );

    if (scannedDay !== currentEventDay) {
      const message =
        scannedDay < currentEventDay
          ? `This QR code was for Day ${scannedDay} which has already passed. Please use today's QR code (Day ${currentEventDay}).`
          : `This QR code is for Day ${scannedDay} but today is Day ${currentEventDay}. Please come back on the correct day.`;
      console.log("Error Message:", message);
    }

    // Calculate when Day 2 would be valid
    const day2Date = new Date(eventStartDate);
    day2Date.setDate(day2Date.getDate() + 1); // Add 1 day for Day 2

    console.log("\\n" + "=".repeat(60));
    console.log("DAY 2 TIMING");
    console.log("=".repeat(60));
    console.log("Day 1 (Event Start):", eventStartDate.toDateString());
    console.log("Day 2 Date:", day2Date.toDateString());
    console.log("Today (Nov 5, 2025):", currentDate.toDateString());

    // Check if today matches Day 2
    const todayString = currentDate.toDateString();
    const day2String = day2Date.toDateString();
    console.log(
      "\\nIs today Day 2?",
      todayString === day2String ? "YES ✅" : "NO ❌"
    );

    if (todayString !== day2String) {
      console.log("Expected Day 2 date:", day2String);
      console.log("Actual today date:", todayString);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkEventDayCalculation();
