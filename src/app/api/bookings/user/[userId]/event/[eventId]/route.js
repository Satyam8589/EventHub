import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  const { userId, eventId } = await params;

  if (!userId || !eventId) {
    return NextResponse.json(
      { error: "Missing userId or eventId" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("tickets")
      .eq("userId", userId)
      .eq("eventId", eventId)
      .eq("status", "CONFIRMED");

    if (error) {
      throw error;
    }

    const totalTickets = data.reduce((sum, booking) => sum + booking.tickets, 0);

    return NextResponse.json({ totalTickets });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user bookings", details: error.message },
      { status: 500 }
    );
  }
}
