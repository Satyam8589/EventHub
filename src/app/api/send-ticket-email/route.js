import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTicketImage } from "@/lib/generateTicketImage";
import {
  generateBookingEmailHTML,
  sendTicketEmailWithRetry,
} from "@/lib/email";

// GET method for deployment verification and health check
export async function GET() {
  try {
    console.log("🔍 Email API Health Check - GET method called");
    return NextResponse.json({
      message: "Send ticket email API is running",
      methods: ["GET", "POST"],
      status: "active",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
    });
  } catch (error) {
    console.error("❌ GET method error:", error);
    return NextResponse.json(
      {
        error: "Health check failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log("📧 Email API - POST method called");

    // Add request debugging
    const contentType = request.headers.get("content-type");
    console.log("Content-Type:", contentType);

    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        {
          error: "Invalid content type. Expected application/json",
        },
        { status: 400 }
      );
    }

    let requestBody;
    try {
      requestBody = await request.json();
      console.log("📦 Request body:", requestBody);
    } catch (jsonError) {
      console.error("❌ JSON parsing error:", jsonError);
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          details: jsonError.message,
        },
        { status: 400 }
      );
    }

    const { bookingId } = requestBody;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Fetch booking details with event and user information
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        event:events(*),
        user:users(*)
      `
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if user has email
    if (!booking.user?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Check if event data exists
    if (!booking.event) {
      return NextResponse.json(
        { error: "Event data not found" },
        { status: 400 }
      );
    }

    // Generate ticket image (returns buffer)
    console.log("Generating ticket image for booking:", bookingId);
    console.log("Booking data structure:", {
      bookingId: booking.id,
      hasEvent: !!booking.event,
      eventId: booking.event?.id,
      hasUser: !!booking.user,
      userEmail: booking.user?.email,
    });
    const ticketImageBuffer = await generateTicketImage(
      booking,
      booking.event,
      booking.user
    );

    // Generate email HTML
    const emailHTML = generateBookingEmailHTML(
      booking,
      booking.event,
      booking.user
    );

    // Send email using enhanced retry logic
    console.log("Sending ticket email to:", booking.user.email);
    const emailResult = await sendTicketEmailWithRetry(
      {
        to: booking.user.email,
        subject: `Your Ticket for ${booking.event.title}`,
        html: emailHTML,
        attachments: [
          {
            filename: `ticket-${booking.id}.png`,
            content: ticketImageBuffer,
            contentType: "image/png",
          },
        ],
      },
      3
    ); // 3 retry attempts

    if (emailResult.success) {
      console.log("Ticket email sent successfully for booking:", bookingId);
      return NextResponse.json({
        success: true,
        message: "Ticket email sent successfully",
      });
    } else {
      console.error("Failed to send ticket email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send ticket email: " + emailResult.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending ticket email:", error);
    return NextResponse.json(
      { error: "Failed to send ticket email" },
      { status: 500 }
    );
  }
}

// GET method for deployment verification
export async function GET() {
  return NextResponse.json({
    message: "Send ticket email API is running",
    methods: ["POST"],
    status: "active",
  });
}
