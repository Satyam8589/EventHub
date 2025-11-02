import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/scan-ticket - Scan and verify ticket
export async function POST(request) {
  try {
    const {
      bookingId: rawBookingId,
      scannedBy,
      eventId,
    } = await request.json();

    // Clean and validate booking ID
    let bookingId = rawBookingId?.toString().trim();
    let scannedDay = null;
    let totalDaysInQR = null;

    console.log("=== SCAN TICKET REQUEST ===");
    console.log("Raw Booking ID received:", rawBookingId);
    console.log("Cleaned Booking ID:", bookingId);

    // Check if this is a day-specific QR code format: bookingId_DAY_X_OF_Y or bookingId_DAY_X
    let dayQRMatch = bookingId?.match(/^(.+)_DAY_(\d+)_OF_(\d+)$/);
    if (!dayQRMatch) {
      // Try the simplified format: bookingId_DAY_X
      dayQRMatch = bookingId?.match(/^(.+)_DAY_(\d+)$/);
    }

    if (dayQRMatch) {
      bookingId = dayQRMatch[1]; // Extract the actual booking ID
      scannedDay = parseInt(dayQRMatch[2]); // Extract the day number
      totalDaysInQR = dayQRMatch[3] ? parseInt(dayQRMatch[3]) : null; // Extract total days if present

      console.log("🎯 Day-specific QR detected:");
      console.log("- Booking ID:", bookingId);
      console.log("- QR Day:", scannedDay);
      console.log("- Total Days in QR:", totalDaysInQR);
    }

    console.log("Booking ID type:", typeof bookingId);
    console.log("Booking ID length:", bookingId?.length);
    console.log("Scanner ID:", scannedBy);
    console.log("Event ID:", eventId);

    if (!bookingId || !scannedBy || !eventId) {
      return NextResponse.json(
        { error: "Booking ID, scanner ID, and event ID are required" },
        { status: 400 }
      );
    }

    // Validate booking ID format (should be UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(bookingId)) {
      console.error("INVALID BOOKING ID FORMAT:", {
        scannedData: bookingId,
        dataLength: bookingId?.length,
        expectedFormat: "UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)",
      });

      return NextResponse.json(
        {
          error: "Invalid QR code format",
          isValid: false,
          message: "QR code appears to be corrupted or invalid",
          debugInfo: {
            scannedData: bookingId,
            dataLength: bookingId?.length,
            expectedFormat: "UUID format required",
          },
        },
        { status: 400 }
      );
    }

    // Verify that the scanner is authorized (SUPER_ADMIN or EVENT_ADMIN)
    const { data: scanner, error: scannerError } = await supabase
      .from("users")
      .select("*")
      .eq("id", scannedBy)
      .single();

    if (
      scannerError ||
      !scanner ||
      (scanner.role !== "SUPER_ADMIN" && scanner.role !== "EVENT_ADMIN")
    ) {
      return NextResponse.json(
        { error: "You are not authorized to scan tickets for this event" },
        { status: 403 }
      );
    }

    // Get event details for validation
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        user:users(id, name, email),
        event:events(id, title, date, time)
      `
      )
      .eq("id", bookingId)
      .single();

    console.log("=== BOOKING LOOKUP RESULT ===");
    console.log("Booking found:", booking ? "YES" : "NO");
    if (booking) {
      console.log("Booking ID in DB:", booking.id);
      console.log("Booking Status:", booking.status);
      console.log("Event ID in booking:", booking.eventId);
      console.log("Event ID requested:", eventId);
      console.log(
        "Booking belongs to requested event:",
        booking.eventId === eventId
      );
    } else {
      console.log("=== ADDITIONAL DEBUGGING ===");
      // Try to find the booking without event restriction
      const { data: anyBooking, error: anyBookingError } = await supabase
        .from("bookings")
        .select("id, eventId, status")
        .eq("id", bookingId)
        .single();

      if (anyBooking) {
        console.log("Booking exists but for different event:");
        console.log("- Booking Event ID:", anyBooking.eventId);
        console.log("- Requested Event ID:", eventId);
        console.log("- Booking Status:", anyBooking.status);
      } else {
        console.log("Booking does not exist in database at all");
        console.log("Searched booking ID:", bookingId);
        console.log("Booking ID type:", typeof bookingId);
        console.log("Booking ID length:", bookingId?.length);
      }
    }

    if (bookingError || !booking) {
      console.error("BOOKING LOOKUP FAILED:", {
        searchedId: bookingId,
        searchedIdLength: bookingId?.length,
        searchedIdType: typeof bookingId,
        eventId: eventId,
        errorDetails: bookingError?.message || "No booking found",
        sqlError: bookingError,
      });

      return NextResponse.json(
        {
          error: "Ticket not found",
          isValid: false,
          message:
            "This QR code does not match any valid tickets in our system",
          debugInfo: {
            scannedData: bookingId,
            dataLength: bookingId?.length,
            searchedInEvent: eventId,
            errorType: bookingError ? "Database Error" : "Booking Not Found",
          },
        },
        { status: 404 }
      );
    }

    // Check if booking is for the correct event
    if (booking.eventId !== eventId) {
      console.log("=== BOOKING FOR DIFFERENT EVENT ===");
      console.log("Booking Event ID:", booking.eventId);
      console.log("Requested Event ID:", eventId);
      console.log("Booking Event Title:", booking.event?.title);

      return NextResponse.json(
        {
          error: "Wrong event",
          isValid: false,
          message: `This ticket is for "${
            booking.event?.title || "another event"
          }", not the currently selected event.`,
          details:
            "Please select the correct event in the admin panel or use a ticket for this event.",
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            actualEventId: booking.eventId,
            requestedEventId: eventId,
          },
        },
        { status: 400 }
      );
    }

    // Check if booking is confirmed
    if (booking.status !== "CONFIRMED") {
      console.log("=== BOOKING NOT CONFIRMED ===");
      console.log("Status:", booking.status);

      return NextResponse.json(
        {
          error: "Invalid ticket",
          isValid: false,
          message: `Booking status is ${booking.status}. Only confirmed bookings are valid.`,
          details:
            "Please contact the event organizer to confirm this booking before scanning.",
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            userEmail: booking.user.email,
            status: booking.status,
            tickets: booking.tickets,
          },
        },
        { status: 400 }
      );
    }

    // Progressive ticket scanning logic - only allow scanning specific ticket numbers on specific days
    const totalTickets = booking.tickets || 1;
    console.log("=== PROGRESSIVE TICKET SCANNING ===");
    console.log("Total tickets in booking:", totalTickets);

    // Calculate which day of the event it is (starting from day 1)
    const eventStartDate = new Date(event.date);
    const currentDate = new Date();

    // Reset time to midnight for accurate day calculation
    eventStartDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const daysDifference = Math.floor(
      (currentDate - eventStartDate) / (1000 * 60 * 60 * 24)
    );
    const currentEventDay = daysDifference + 1; // Day 1, 2, 3, etc.

    console.log("Event start date:", eventStartDate.toISOString());
    console.log("Current date:", currentDate.toISOString());
    console.log("Days difference:", daysDifference);
    console.log("Current event day:", currentEventDay);

    // If this is a day-specific QR code, validate that it matches the current day
    if (scannedDay !== null) {
      console.log("🔍 Validating day-specific QR code:");
      console.log("- QR is for day:", scannedDay);
      console.log("- Current event day:", currentEventDay);

      if (scannedDay !== currentEventDay) {
        return NextResponse.json(
          {
            error: "Wrong day for this QR code",
            isValid: false,
            message:
              scannedDay < currentEventDay
                ? `This QR code was for Day ${scannedDay} which has already passed. Please use today's QR code (Day ${currentEventDay}).`
                : `This QR code is for Day ${scannedDay} but today is Day ${currentEventDay}. Please come back on the correct day.`,
            booking: {
              id: booking.id,
              eventTitle: booking.event.title,
              userName: booking.user.name,
              qrDay: scannedDay,
              currentDay: currentEventDay,
              totalTickets: totalTickets,
            },
          },
          { status: 400 }
        );
      }
    }

    // Check if we're within the valid event period
    if (currentEventDay < 1) {
      return NextResponse.json(
        {
          error: "Event not started yet",
          isValid: false,
          message: `Event starts on ${eventStartDate.toLocaleDateString()}. Please come back on the event day.`,
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            eventStartDate: eventStartDate.toLocaleDateString(),
          },
        },
        { status: 400 }
      );
    }

    if (currentEventDay > totalTickets) {
      return NextResponse.json(
        {
          error: "All tickets used",
          isValid: false,
          message: `All ${totalTickets} ticket(s) for this booking have been used. Thank you for visiting!`,
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            totalTickets: totalTickets,
            daysElapsed: currentEventDay - 1,
          },
        },
        { status: 400 }
      );
    }

    // Parse existing scanned tickets data
    let scannedTicketsData = {};
    if (booking.paymentId && booking.paymentId.startsWith("SCANNED_TICKETS_")) {
      try {
        const ticketsDataString = booking.paymentId.replace(
          "SCANNED_TICKETS_",
          ""
        );
        scannedTicketsData = JSON.parse(ticketsDataString);
        console.log("Existing scanned tickets:", scannedTicketsData);
      } catch (e) {
        console.log(
          "Could not parse existing scanned tickets data, starting fresh"
        );
        scannedTicketsData = {};
      }
    }

    // Check if ALL tickets have already been scanned (booking completed)
    const scannedTicketsCount = Object.keys(scannedTicketsData).length;
    if (scannedTicketsCount >= totalTickets) {
      console.log("🎉 All tickets already used - booking fully completed");
      return NextResponse.json(
        {
          error: "All tickets already used",
          isValid: false,
          message: `🎉 All ${totalTickets} ticket(s) for this booking have already been used. Thank you for visiting throughout the event!`,
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            userEmail: booking.user.email,
            totalTickets: totalTickets,
            scannedTickets: scannedTicketsCount,
            daysAttended: Object.keys(scannedTicketsData).sort().join(", "),
            isFullyCompleted: true,
            completionMessage:
              "This booking is fully completed - all tickets have been used successfully!",
          },
        },
        { status: 200 } // Changed to 200 since this is a successful recognition, not an error
      );
    }

    // Check if the current day's ticket has already been scanned
    const ticketNumberForToday = currentEventDay;
    if (scannedTicketsData[ticketNumberForToday]) {
      const scannedTime = new Date(scannedTicketsData[ticketNumberForToday]);
      return NextResponse.json(
        {
          error: "Today's ticket already scanned",
          isValid: false,
          message: `Ticket ${ticketNumberForToday} was already used on ${scannedTime.toLocaleString()}. Thank you for visiting! ✓`,
          booking: {
            id: booking.id,
            eventTitle: booking.event.title,
            userName: booking.user.name,
            ticketNumber: ticketNumberForToday,
            totalTickets: totalTickets,
            usedAt: scannedTime.toLocaleString(),
            nextTicketAvailable:
              ticketNumberForToday < totalTickets
                ? `Day ${ticketNumberForToday + 1}`
                : "All tickets used",
          },
        },
        { status: 400 }
      );
    }

    // Mark the current day's ticket as scanned
    const scannedAt = new Date().toISOString();
    scannedTicketsData[ticketNumberForToday] = scannedAt;

    const { error: scanError } = await supabase
      .from("bookings")
      .update({
        paymentId: `SCANNED_TICKETS_${JSON.stringify(scannedTicketsData)}`,
        updatedAt: scannedAt,
      })
      .eq("id", booking.id);

    if (scanError) {
      console.error("Error marking ticket as scanned:", scanError);
      return NextResponse.json(
        { error: "Failed to process ticket scan" },
        { status: 500 }
      );
    }

    // Determine the success message and next ticket info
    const isLastTicket = ticketNumberForToday === totalTickets;
    const nextTicketDay = isLastTicket ? null : ticketNumberForToday + 1;
    const nextTicketDate = nextTicketDay
      ? new Date(
          eventStartDate.getTime() + (nextTicketDay - 1) * 24 * 60 * 60 * 1000
        )
      : null;

    // If this was the last ticket, mark booking as fully completed
    let completionUpdate = {};
    if (isLastTicket) {
      console.log("🎯 All tickets used - keeping status as CONFIRMED for now");
      // TODO: After adding COMPLETED to enum, uncomment this:
      // completionUpdate = {
      //   status: "COMPLETED", // Change status to completed
      //   completedAt: scannedAt, // Add completion timestamp
      //   // Note: We keep the scanned tickets data for record keeping
      // };
    }

    // Update booking with scan data and completion status if needed
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        paymentId: `SCANNED_TICKETS_${JSON.stringify(scannedTicketsData)}`,
        updatedAt: scannedAt,
        ...completionUpdate,
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("Error marking ticket as scanned:", updateError);
      return NextResponse.json(
        { error: "Failed to process ticket scan" },
        { status: 500 }
      );
    }

    // Determine success message based on completion status
    const successMessage = isLastTicket
      ? "🎉 All Tickets Used! Thank You for Visiting Throughout the Event! ✓"
      : "Thank You for Visiting! ✓";

    return NextResponse.json({
      isValid: true,
      message: successMessage,
      booking: {
        id: booking.id,
        eventTitle: booking.event.title,
        userName: booking.user.name,
        userEmail: booking.user.email,
        ticketNumber: ticketNumberForToday,
        totalTickets: totalTickets,
        scannedAt: scannedAt,
        scannedBy: scanner.name,
        status: isLastTicket ? "COMPLETED" : booking.status,
        isScanned: true,
        isFullyCompleted: isLastTicket,
        progressInfo: {
          currentDay: currentEventDay,
          ticketUsedToday: ticketNumberForToday,
          remainingTickets: totalTickets - ticketNumberForToday,
          nextTicketAvailable: nextTicketDay
            ? `Day ${nextTicketDay} (${nextTicketDate.toLocaleDateString()})`
            : "All tickets used",
          allScannedTickets: scannedTicketsData,
          completionStatus: isLastTicket
            ? "All tickets used - Booking completed!"
            : "More tickets available",
        },
        qrInfo: scannedDay
          ? {
              scannedQRDay: scannedDay,
              expectedDay: currentEventDay,
              isCorrectDay: scannedDay === currentEventDay,
              qrFormat: "day-specific",
            }
          : {
              qrFormat: "booking-id-only",
            },
      },
    });
  } catch (error) {
    console.error("Error scanning ticket:", error);
    return NextResponse.json(
      {
        error: "Failed to scan ticket",
        isValid: false,
        message: "An error occurred while processing the ticket",
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/scan-ticket?eventId=xxx - Get scanning statistics for event
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const scannerId = searchParams.get("scannerId");

    if (!eventId || !scannerId) {
      return NextResponse.json(
        { error: "Event ID and scanner ID are required" },
        { status: 400 }
      );
    }

    // Verify scanner is authorized (SUPER_ADMIN or EVENT_ADMIN)
    const { data: scanner, error: scannerError } = await supabase
      .from("users")
      .select("*")
      .eq("id", scannerId)
      .single();

    if (
      scannerError ||
      !scanner ||
      (scanner.role !== "SUPER_ADMIN" && scanner.role !== "EVENT_ADMIN")
    ) {
      return NextResponse.json(
        { error: "You are not authorized to access this event's data" },
        { status: 403 }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all confirmed bookings for this event (including completed ones)
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        user:users(id, name, email, phone)
      `
      )
      .eq("eventId", eventId)
      .in("status", ["CONFIRMED", "COMPLETED"]);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch event data" },
        { status: 500 }
      );
    }

    const totalTickets = bookings.reduce(
      (sum, booking) => sum + booking.tickets,
      0
    );

    // Calculate progressive scanning statistics and user details
    let scannedTicketsCount = 0;
    let progressiveScannedBookings = 0;
    let completedBookings = 0;
    let scannedBookingsData = [];
    let userBookingStats = [];

    bookings.forEach((booking) => {
      let bookingScannedTickets = 0;
      let scannedTicketsData = {};

      // Parse scanned tickets data
      if (
        booking.paymentId &&
        booking.paymentId.startsWith("SCANNED_TICKETS_")
      ) {
        try {
          const ticketsDataString = booking.paymentId.replace(
            "SCANNED_TICKETS_",
            ""
          );
          scannedTicketsData = JSON.parse(ticketsDataString);
          bookingScannedTickets = Object.keys(scannedTicketsData).length;
          scannedTicketsCount += bookingScannedTickets;

          if (bookingScannedTickets > 0) {
            progressiveScannedBookings++;
          }
        } catch (e) {
          // If parsing fails, it's not progressive scanning data
        }
      } else if (
        booking.paymentId &&
        booking.paymentId.startsWith("SCANNED_")
      ) {
        // Legacy single scan format
        bookingScannedTickets = 1;
        scannedTicketsCount += 1;
        progressiveScannedBookings++;
      }

      // Track completion status
      const isBookingCompleted =
        booking.status === "COMPLETED" ||
        bookingScannedTickets === booking.tickets;
      if (isBookingCompleted) {
        completedBookings++;
      }

      // Add to user booking stats for admin display
      userBookingStats.push({
        id: booking.id,
        userName: booking.user.name,
        userEmail: booking.user.email,
        userPhone: booking.user.phone || "Not provided",
        totalTickets: booking.tickets,
        scannedTickets: bookingScannedTickets,
        remainingTickets: booking.tickets - bookingScannedTickets,
        status: booking.status,
        isCompleted: isBookingCompleted,
        bookedAt: booking.createdAt,
        lastActivity: booking.updatedAt,
        scannedDays: Object.keys(scannedTicketsData)
          .map((day) => parseInt(day))
          .sort(),
        progressPercentage: (
          (bookingScannedTickets / booking.tickets) *
          100
        ).toFixed(0),
      });

      if (bookingScannedTickets > 0) {
        scannedBookingsData.push({
          id: booking.id,
          userName: booking.user.name,
          userEmail: booking.user.email,
          totalTickets: booking.tickets,
          scannedTickets: bookingScannedTickets,
          scannedTicketsData: scannedTicketsData,
          lastScannedAt: booking.updatedAt,
          isCompleted: isBookingCompleted,
        });
      }
    });

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        capacity: event.capacity,
      },
      statistics: {
        totalBookings: bookings.length,
        totalTickets,
        scannedTickets: scannedTicketsCount,
        scannedBookings: progressiveScannedBookings,
        completedBookings: completedBookings,
        confirmedBookings: bookings.filter((b) => b.status === "CONFIRMED")
          .length,
        availableTickets: event.capacity - totalTickets,
        scanProgress:
          totalTickets > 0
            ? ((scannedTicketsCount / totalTickets) * 100).toFixed(1)
            : 0,
        completionRate:
          bookings.length > 0
            ? ((completedBookings / bookings.length) * 100).toFixed(1)
            : 0,
      },
      userBookings: userBookingStats.sort(
        (a, b) => b.scannedTickets - a.scannedTickets
      ), // Sort by most scanned first
      scannedBookings: scannedBookingsData,
      recentBookings: bookings.slice(-10).map((booking) => ({
        id: booking.id,
        userName: booking.user.name,
        userEmail: booking.user.email,
        tickets: booking.tickets,
        bookedAt: booking.createdAt,
        status: booking.status,
      })),
    });
  } catch (error) {
    console.error("Error getting scan statistics:", error);
    return NextResponse.json(
      { error: "Failed to get statistics" },
      { status: 500 }
    );
  }
}
