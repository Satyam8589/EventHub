import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/admin/verify-ticket - Verify ticket for event admin
export async function POST(request) {
  try {
    const { ticketCode, eventId, adminUserId } = await request.json();

    if (!ticketCode || !eventId || !adminUserId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user is authorized to verify tickets for this event
    const { data: adminUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", adminUserId)
      .single();

    if (
      userError ||
      !adminUser ||
      (adminUser.role !== "SUPER_ADMIN" && adminUser.role !== "EVENT_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // For event admins, they can verify tickets for any event they have access to
    // In our simplified model, any EVENT_ADMIN can verify tickets for any event
    // In a more complex system, you'd have event-specific admin assignments

    // Find the booking by ticket code (using booking ID as ticket code)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        user:users(name, email),
        event:events(title, date)
      `
      )
      .eq("id", ticketCode)
      .eq("eventId", eventId)
      .eq("status", "CONFIRMED")
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({
        success: false,
        message: "Invalid ticket code or ticket not found for this event.",
      });
    }

    // Check if this booking has already been scanned
    if (booking.paymentId && booking.paymentId.startsWith("SCANNED_")) {
      const scannedTime = new Date(booking.paymentId.replace("SCANNED_", ""));
      return NextResponse.json({
        success: false,
        message: `This ticket was already used on ${scannedTime.toLocaleString()}. Thank you for visiting!`,
        booking: booking,
      });
    }

    // Mark ticket as scanned
    const scannedAt = new Date().toISOString();
    const { error: scanError } = await supabase
      .from("bookings")
      .update({
        paymentId: `SCANNED_${scannedAt}`,
        updatedAt: scannedAt,
      })
      .eq("id", booking.id);

    if (scanError) {
      console.error("Error marking ticket as scanned:", scanError);
      return NextResponse.json(
        { error: "Failed to process ticket verification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Ticket verified successfully! Entry granted. Thank you for visiting, enjoy the event!",
      booking: booking,
    });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    return NextResponse.json(
      { error: "Failed to verify ticket" },
      { status: 500 }
    );
  }
}
