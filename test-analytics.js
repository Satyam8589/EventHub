// Test script for event analytics API
// This script can be run in browser console to test the analytics endpoint

async function testEventAnalytics() {
  try {
    console.log("Testing event analytics API...");

    // First, let's get list of events to find an event ID
    const eventsResponse = await fetch("/api/admin/events");
    if (!eventsResponse.ok) {
      throw new Error("Failed to fetch events");
    }

    const eventsData = await eventsResponse.json();
    console.log("Available events:", eventsData);

    if (eventsData.length === 0) {
      console.log("No events found. Create an event first.");
      return;
    }

    // Use the first event for testing
    const eventId = eventsData[0].id;
    console.log("Testing analytics for event ID:", eventId);

    // Now test the analytics endpoint
    const analyticsResponse = await fetch(
      `/api/admin/event-analytics?eventId=${eventId}`
    );
    if (!analyticsResponse.ok) {
      throw new Error(
        `Analytics API failed: ${analyticsResponse.status} ${analyticsResponse.statusText}`
      );
    }

    const analyticsData = await analyticsResponse.json();
    console.log("Analytics data:", analyticsData);
    console.log("Event name:", analyticsData.event?.name);
    console.log("Total Revenue:", analyticsData.summary?.totalRevenue);
    console.log("Total Tickets:", analyticsData.summary?.totalTickets);
    console.log("Start Date:", analyticsData.event?.startDate);
    console.log("End Date:", analyticsData.event?.endDate);

    return analyticsData;
  } catch (error) {
    console.error("Test failed:", error);
    return null;
  }
}

// Run the test
console.log("Copy and paste this function in browser console:");
console.log("testEventAnalytics()");
