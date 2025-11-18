import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/qr-scan - Handle QR code scanning
export async function POST(request) {
  try {
    const { qrData } = await request.json();
    // Parse QR data to extract booking ID and day information
    let bookingId, dayNumber, totalDays;

    if (qrData.includes("_DAY_")) {
      // Multi-day QR format: "bookingId_DAY_1_OF_3"
      const parts = qrData.split("_DAY_");
      bookingId = parts[0];
      const dayPart = parts[1]; // "1_OF_3"
      const dayMatch = dayPart.match(/(\d+)_OF_(\d+)/);
      if (dayMatch) {
        dayNumber = parseInt(dayMatch[1]);
        totalDays = parseInt(dayMatch[2]);
      }
    } else {
      // Single day QR format: just the booking ID
      bookingId = qrData;
      dayNumber = 1;
      totalDays = 1;
    }
    // Validate booking exists
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid QR code - booking not found",
          error: "BOOKING_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Check if booking is confirmed
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot scan - booking status is ${booking.status}`,
          error: "BOOKING_NOT_CONFIRMED",
        },
        { status: 400 }
      );
    }

    // Fetch event details for date validation
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, date, enddate")
      .eq("id", booking.eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found for this booking",
          error: "EVENT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Date validation for multi-day events
    if (totalDays > 1) {
      const eventStartDate = new Date(event.date);
      const currentDate = new Date();

      // Calculate what day of the event it should be today
      const daysSinceStart = Math.floor(
        (currentDate - eventStartDate) / (1000 * 60 * 60 * 24)
      );
      const currentEventDay = daysSinceStart + 1; // Day 1, 2, 3, etc.

      console.log("ðŸ“… Date validation:", {
        eventStartDate: eventStartDate.toISOString(),
        currentDate: currentDate.toISOString(),
        daysSinceStart,
        currentEventDay,
        qrDayNumber: dayNumber,
        totalDays,
      });

      // Check if the event has started
      if (currentEventDay < 1) {
        return NextResponse.json(
          {
            success: false,
            message: `Event hasn't started yet. Event begins on ${eventStartDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`,
            error: "EVENT_NOT_STARTED",
          },
          { status: 400 }
        );
      }

      // Check if the event has ended
      if (currentEventDay > totalDays) {
        return NextResponse.json(
          {
            success: false,
            message: `Event has ended. This was a ${totalDays}-day event.`,
            error: "EVENT_ENDED",
          },
          { status: 400 }
        );
      }

      // Check if trying to scan future day's QR code
      if (dayNumber > currentEventDay) {
        const targetDate = new Date(eventStartDate);
        targetDate.setDate(targetDate.getDate() + (dayNumber - 1));

        return NextResponse.json(
          {
            success: false,
            message: `Cannot scan Day ${dayNumber} QR code yet. This QR code is valid on ${targetDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}. Today is Day ${currentEventDay} of the event.`,
            error: "FUTURE_DAY_QR",
            validDate: targetDate.toISOString(),
            currentEventDay,
          },
          { status: 400 }
        );
      }

      // Allow scanning of current day or previous days (for late entry)
      if (dayNumber < currentEventDay) {
      }
    } else {
      // Single day event - just check if event date matches today (with some tolerance)
      const eventDate = new Date(event.date);
      const currentDate = new Date();

      // Allow scanning on the event date (with timezone tolerance)
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

      const dayDifference =
        (currentDateOnly - eventDateOnly) / (1000 * 60 * 60 * 24);

      console.log("ðŸ“… Single day event validation:", {
        eventDate: eventDate.toISOString(),
        currentDate: currentDate.toISOString(),
        dayDifference,
      });

      if (dayDifference < 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Event hasn't started yet. Event is on ${eventDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`,
            error: "EVENT_NOT_STARTED",
          },
          { status: 400 }
        );
      }

      if (dayDifference > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Event has ended. Event was on ${eventDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`,
            error: "EVENT_ENDED",
          },
          { status: 400 }
        );
      }
    }

    // Get or create scanned QR codes record
    let scannedQRs = [];
    if (booking.scannedQRs) {
      try {
        scannedQRs = JSON.parse(booking.scannedQRs);
      } catch (e) {
        scannedQRs = [];
      }
    }

    // Check if this specific QR code (day) has already been scanned
    const isAlreadyScanned = scannedQRs.some(
      (scanned) => scanned.dayNumber === dayNumber && scanned.qrData === qrData
    );

    if (isAlreadyScanned) {
      const scannedInfo = scannedQRs.find(
        (scanned) =>
          scanned.dayNumber === dayNumber && scanned.qrData === qrData
      );
      return NextResponse.json(
        {
          success: false,
          message: `This QR code for Day ${dayNumber} was already scanned on ${new Date(
            scannedInfo.scannedAt
          ).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
          error: "QR_ALREADY_SCANNED",
          scannedAt: scannedInfo.scannedAt,
        },
        { status: 400 }
      );
    }

    // Add this QR scan to the record
    const newScan = {
      qrData,
      dayNumber,
      totalDays,
      scannedAt: new Date().toISOString(),
      scanId: `${bookingId}_DAY_${dayNumber}_${Date.now()}`,
    };

    scannedQRs.push(newScan);

    // Update booking with scanned QR information
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        scannedQRs: JSON.stringify(scannedQRs),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to record QR scan",
          error: "UPDATE_FAILED",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      message: `Entry confirmed for Day ${dayNumber}${
        totalDays > 1 ? ` of ${totalDays}` : ""
      }`,
      data: {
        bookingId,
        dayNumber,
        totalDays,
        scannedAt: newScan.scannedAt,
        eventTitle: event?.title,
        eventDate: event?.date,
        totalScannedDays: scannedQRs.length,
        remainingDays: totalDays - scannedQRs.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process QR scan",
        error: "PROCESSING_ERROR",
      },
      { status: 500 }
    );
  }
}

// GET /api/qr-scan?bookingId=xxx - Get QR scan status for a booking
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, status, scannedQRs, eventId")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    let scannedQRs = [];
    if (booking.scannedQRs) {
      try {
        scannedQRs = JSON.parse(booking.scannedQRs);
      } catch (e) {
      }
    }

    // Get event details to calculate total days
    const { data: event } = await supabase
      .from("events")
      .select("date, enddate")
      .eq("id", booking.eventId)
      .single();

    let totalDays = 1;
    if (event && event.enddate) {
      const startDate = new Date(event.date);
      const endDate = new Date(event.enddate);
      totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    }

    return NextResponse.json({
      bookingId,
      status: booking.status,
      totalDays,
      scannedQRs,
      totalScannedDays: scannedQRs.length,
      remainingDays: totalDays - scannedQRs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch QR scan status" },
      { status: 500 }
    );
  }
}
