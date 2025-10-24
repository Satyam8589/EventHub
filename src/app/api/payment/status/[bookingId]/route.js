import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/payment/status/[bookingId] - Check payment status
export async function GET(request, { params }) {
  try {
    const bookingId = params.bookingId;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Return booking status
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        paymentId: booking.paymentId,
        razorpayOrderId: booking.razorpayOrderId,
        tickets: booking.tickets,
        totalAmount: booking.totalAmount,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        paymentVerifiedAt: booking.paymentVerifiedAt,
        failureReason: booking.failureReason,
      },
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      {
        error: "Failed to check payment status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
