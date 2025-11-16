import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";

// GET /api/events - Get all events
export async function GET() {
  try {
    // First get all events
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("featured", { ascending: false })
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }
    console.log(
      "Events details:",
      events?.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        featured: e.featured,
        date: e.date,
        endDate: e.endDate,
      }))
    );

    // Filter out expired events - show only upcoming and currently running events
    const now = new Date();

    const activeEvents = events.filter((event) => {
      // Skip events with CANCELLED status
      if (event.status === "CANCELLED") {
        return false;
      }

      // If event has endDate (either endDate or enddate), use it to determine if event is still active
      const endDateValue = event.endDate || event.enddate;
      if (endDateValue) {
        const endDate = new Date(endDateValue);
        // Be more strict - only show if end date is clearly in the future
        return endDate > now;
      }

      // If no endDate, consider the event as a single-day event
      // For single-day events, check if the event date is today or in the future (date-only comparison)
      const eventDate = new Date(event.date);
      const eventDateOnly = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      );
      const nowDateOnly = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      // Show events that are today or in the future
      return eventDateOnly >= nowDateOnly;
    });
    console.log(
      "Active events:",
      activeEvents.map((e) => ({
        id: e.id,
        title: e.title,
        featured: e.featured,
        date: e.date,
        endDate: e.endDate,
      }))
    );

    // Get booking counts for each event
    // ⚠️ IMPORTANT: Only count CONFIRMED bookings (not PENDING)
    // PENDING bookings don't count because user might cancel payment
    // Capacity is only reduced when payment succeeds (CONFIRMED)
    const eventsWithCounts = await Promise.all(
      activeEvents.map(async (event) => {
        try {
          // Get only CONFIRMED bookings for this event to sum up total tickets
          const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("tickets")
            .eq("eventId", event.id)
            .eq("status", "CONFIRMED"); // ✅ Only count CONFIRMED bookings

          if (bookingsError) {
            // Return event with 0 bookings if query fails
            return {
              ...event,
              _count: {
                bookings: 0,
              },
            };
          }

          // Sum up all tickets from CONFIRMED bookings for this event
          const totalTickets =
            bookings?.reduce(
              (sum, booking) => sum + (booking.tickets || 0),
              0
            ) || 0;

          return {
            ...event,
            _count: {
              bookings: totalTickets,
            },
          };
        } catch (err) {
          // Return event with 0 bookings if exception occurs
          return {
            ...event,
            _count: {
              bookings: 0,
            },
          };
        }
      })
    );
    console.log(
      "Events data:",
      eventsWithCounts.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        status: e.status,
      }))
    );

    const response = NextResponse.json({ events: eventsWithCounts });
    // Prevent caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch events", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type");
    let body;
    let imageFile = null;

    if (contentType && contentType.includes("multipart/form-data")) {
      // Handle FormData (with file upload)
      const formData = await request.formData();
      body = {
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        location: formData.get("location"),
        venue: formData.get("venue"),
        date: formData.get("date"),
        maxAttendees: formData.get("maxAttendees"),
        ticketPrice: formData.get("ticketPrice"),
        organizerId: formData.get("organizerId"),
      };
      imageFile = formData.get("image");
    } else {
      // Handle JSON
      body = await request.json();
    }

    const {
      title,
      description,
      category,
      location,
      venue,
      date,
      endDate,
      time, // ✅ Receive time as separate field
      endTime, // ✅ Receive endTime as separate field
      maxAttendees,
      ticketPrice,
      organizerId,
      organizerName,
      organizerEmail,
      organizerPhone,
      featured,
      imageUrl: providedImageUrl,
    } = body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !location ||
      !venue ||
      !date ||
      !organizerId ||
      !organizerName ||
      !organizerEmail
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(organizerEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Allow organizer (admin) to post multiple events: removed single-event restriction

    // Handle image - use provided URL, upload to Cloudinary, or use default
    let imageUrl =
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&crop=center";

    // If imageUrl is provided in JSON body, use it
    if (providedImageUrl) {
      imageUrl = providedImageUrl;
    }
    // If imageFile exists (FormData), upload it
    else if (imageFile && imageFile.size > 0) {
      try {
        // Convert file to buffer
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(
          buffer,
          "events", // folder
          "image", // resource type
          {
            public_id: `event_${Date.now()}`, // unique public ID
            tags: ["event", "upload"], // tags for organization
          }
        );

        imageUrl = uploadResult.secure_url;
      } catch (error) {
        // Continue with default image if upload fails
      }
    }

    // ✅ Fix: Use time and endTime directly from form (preserve exact values)
    // Convert date to ISO string (date only, no time component)
    const eventDate = new Date(date + "T00:00:00"); // Add midnight to avoid timezone issues
    const eventDateISO = eventDate.toISOString().split("T")[0] + "T00:00:00.000Z";

    // Handle endDate if provided
    let eventEndDateISO = null;
    if (endDate) {
      const eventEndDate = new Date(endDate + "T00:00:00");
      eventEndDateISO = eventEndDate.toISOString().split("T")[0] + "T00:00:00.000Z";
    }

    // Prepare event data
    const eventData = {
      id: crypto.randomUUID(), // Generate unique ID
      title,
      description,
      category,
      location,
      venue,
      date: eventDateISO, // Date with time set to midnight UTC
      time: time || "00:00", // ✅ Use time directly from form (HH:MM format)
      price: parseFloat(ticketPrice) || 0,
      capacity: parseInt(maxAttendees) || 100,
      imageUrl,
      organizerId,
      organizerName,
      organizerEmail,
      organizerPhone,
      featured: featured || false,
      status: "UPCOMING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add endDate and endTime if provided - use lowercase to match PostgreSQL column name
    if (eventEndDateISO) {
      eventData.enddate = eventEndDateISO; // Use lowercase 'enddate'
    }
    if (endTime) {
      eventData.endtime = endTime; // ✅ Use endTime directly from form (HH:MM format)
    }

    let { data: event, error: createError } = await supabase
      .from("events")
      .insert([eventData])
      .select("*")
      .single();

    // If endDate column doesn't exist, retry without endDate
    if (
      createError &&
      createError.code === "PGRST204" &&
      (createError.message.includes("endDate") ||
        createError.message.includes("enddate"))
    ) {
      // Remove endDate from event data
      const { enddate: _, endDate: __, ...eventDataWithoutEndDate } = eventData;

      const { data: retryEvent, error: retryCreateError } = await supabase
        .from("events")
        .insert([eventDataWithoutEndDate])
        .select("*")
        .single();

      event = retryEvent;
      createError = retryCreateError;
    }

    if (createError) {
      throw createError;
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
