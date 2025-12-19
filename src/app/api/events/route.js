import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { sendPushNotificationToMultiple } from "@/lib/pushNotification";
import { triggerNotification, NOTIFICATION_EVENTS } from "@/lib/pusher";
import { randomUUID } from "crypto";

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

    // Filter out expired events - show only upcoming and currently running events
    // ✅ Use UTC for comparison with database UTC timestamps
    const now = new Date();

    const activeEvents = events.filter((event) => {
      // Skip events with CANCELLED status
      if (event.status === "CANCELLED") {
        return false;
      }

      // If event has endDate (either endDate or enddate), use it to determine if event is still active
      // Use enddate (lowercase) which is the correct field from database
      const endDateValue = event.enddate || event.endDate;
      if (endDateValue) {
        // Ensure proper UTC format
        let utcEndDate = endDateValue;
        if (!endDateValue.includes("T") || !endDateValue.endsWith("Z")) {
          // Convert "2025-11-22 17:30:00" to "2025-11-22T17:30:00Z"
          utcEndDate = endDateValue.replace(" ", "T");
          if (!utcEndDate.endsWith("Z")) utcEndDate += "Z";
        }
        const endDate = new Date(utcEndDate);

        // ✅ Compare UTC with UTC - only show if end date is in the future
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

    // Check for low ticket events and trigger notifications
    for (const event of eventsWithCounts) {
      const remainingTickets = event.capacity - event._count.bookings;
      const percentageRemaining = (remainingTickets / event.capacity) * 100;

      // Trigger notification if less than 10% tickets remain and at least 1 ticket left
      if (
        percentageRemaining < 10 &&
        percentageRemaining > 0 &&
        remainingTickets > 0
      ) {
        // Only trigger if we haven't notified recently (you might want to add a cache/db check)
        await triggerNotification("events", NOTIFICATION_EVENTS.LOW_TICKETS, {
          eventId: event.id,
          eventTitle: event.title,
          remainingTickets: remainingTickets,
          capacity: event.capacity,
          eventDate: event.date,
        });
      }
    }

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
      max_tickets_per_user,
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

    const [y, m, d] = (date || "").split("-").map(Number);
    const [hh, mm] = (time || "00:00").split(":").map(Number);
    const eventDateISO = new Date(
      Date.UTC(y, (m || 1) - 1, d || 1, (hh || 0) - 5, (mm || 0) - 30)
    ).toISOString();

    // Handle endDate if provided
    let eventEndDateISO = null;
    if (endDate && (endTime || time)) {
      const [ey, em, ed] = (endDate || "").split("-").map(Number);
      const [ehh, emm] = (endTime || time || "00:00").split(":").map(Number);
      eventEndDateISO = new Date(
        Date.UTC(ey, (em || 1) - 1, ed || 1, (ehh || 0) - 5, (emm || 0) - 30)
      ).toISOString();
    }

    // Prepare event data
    const nowUtcIso = new Date().toISOString();
    const eventData = {
      id: randomUUID(),
      title,
      description,
      category,
      location,
      venue,
      date: eventDateISO,
      time: time || "00:00",
      price: parseFloat(ticketPrice) || 0,
      capacity: parseInt(maxAttendees) || 100,
      max_tickets_per_user: max_tickets_per_user,
      imageUrl,
      organizerId,
      organizerName,
      organizerEmail,
      organizerPhone,
      featured: featured || false,
      show_discount_field: body.show_discount_field !== false,
      show_custom_field: body.show_custom_field || false,
      custom_field_label: body.custom_field_label || null,
      status: "UPCOMING",
      createdAt: nowUtcIso,
      updatedAt: nowUtcIso,
      experienceHighlights: body.experienceHighlights || null,
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

    // Handle missing columns gracefully
    if (createError && createError.code === "PGRST204") {
      if (createError.message.includes("experienceHighlights")) {
        const { experienceHighlights, ...rest } = eventData;
        // Try snake_case
        const eventDataSnake = {
          ...rest,
          experience_highlights: experienceHighlights,
        };
        let { data: retryEventSnake, error: retryErrSnake } = await supabase
          .from("events")
          .insert([eventDataSnake])
          .select("*")
          .single();
        event = retryEventSnake;
        createError = retryErrSnake;
        // If still missing, try lowercase
        if (
          createError &&
          createError.code === "PGRST204" &&
          createError.message.includes("experience_highlights")
        ) {
          const eventDataLower = {
            ...rest,
            experiencehighlights: experienceHighlights,
          };
          const { data: retryEventLower, error: retryErrLower } = await supabase
            .from("events")
            .insert([eventDataLower])
            .select("*")
            .single();
          event = retryEventLower;
          createError = retryErrLower;
        }
      }

      if (
        createError &&
        createError.code === "PGRST204" &&
        (createError.message.includes("endDate") ||
          createError.message.includes("enddate") ||
          createError.message.includes("experienceHighlights") ||
          createError.message.includes("experience_highlights") ||
          createError.message.includes("experiencehighlights"))
      ) {
        const {
          enddate: _,
          endDate: __,
          experienceHighlights: ___,
          experience_highlights: ____,
          ...eventDataWithoutOptional
        } = eventData;
        const { data: retryEvent, error: retryCreateError } = await supabase
          .from("events")
          .insert([eventDataWithoutOptional])
          .select("*")
          .single();
        event = retryEvent;
        createError = retryCreateError;
      }
    }

    if (createError) {
      throw createError;
    }

    // Trigger real-time notification for new event
    await triggerNotification("events", NOTIFICATION_EVENTS.NEW_EVENT, {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      eventPrice: event.price,
      eventImage: event.imageUrl,
    });

    // Send push notifications to all subscribers
    try {
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*");

      if (subscriptions && subscriptions.length > 0) {
        const pushSubscriptions = subscriptions.map((sub) => ({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }));

        await sendPushNotificationToMultiple(pushSubscriptions, {
          title: "🎉 New Event Available!",
          message: `${event.title} has been posted`,
          icon: "/icon-192.png",
          image: event.imageUrl,
          data: {
            url: `/events/${event.id}`,
            eventId: event.id,
          },
        });
      }
    } catch (pushError) {
      // Don't fail the request if push notifications fail
      console.error("Failed to send push notifications:", pushError);
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
