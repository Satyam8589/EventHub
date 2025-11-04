export async function GET() {
  try {
    // Simulate the same fetch that the frontend does
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/events`);
    const data = await response.json();

    const now = new Date();

    // Apply the same filtering logic as the frontend
    const filteredEvents = data.events.filter((event) => {
      try {
        // Search filtering (empty search term matches all)
        const searchTerm = "";
        const matchesSearch =
          event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchTerm.toLowerCase());

        // Category filtering (All Categories matches all)
        const selectedCategory = "All Categories";
        const matchesCategory =
          selectedCategory === "All Categories" ||
          event.category === selectedCategory;

        // Date filtering logic (same as frontend)
        const currentDate = new Date();
        const isNotExpired = (() => {
          const endDateValue = event.endDate || event.enddate;
          if (endDateValue) {
            return new Date(endDateValue) >= currentDate;
          } else {
            const eventDate = new Date(event.date);
            const eventDateOnly = new Date(
              eventDate.getFullYear(),
              eventDate.getMonth(),
              eventDate.getDate()
            );
            const currentDateOnly = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate()
            );
            return eventDateOnly >= currentDateOnly;
          }
        })();

        const result = matchesSearch && matchesCategory && isNotExpired;

        return result;
      } catch (error) {
        console.error("Error filtering event:", error, event);
        return false;
      }
    });

    return Response.json({
      currentTime: now.toISOString(),
      apiResponse: data,
      totalEventsFromAPI: data.events?.length || 0,
      filteredEventsCount: filteredEvents.length,
      filteredEvents: filteredEvents,
      filteringResults: data.events?.map((event) => ({
        title: event.title,
        date: event.date,
        endDate: event.endDate || event.enddate,
        willShow: filteredEvents.some((fe) => fe.id === event.id),
      })),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return Response.json(
      {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
