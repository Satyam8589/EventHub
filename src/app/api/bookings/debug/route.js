import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/bookings/debug - Debug endpoint to check all bookings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("=== DEBUG BOOKINGS CHECK ===");
    console.log("User ID to check:", userId);

    // Get ALL bookings without filters
    const { data: allBookings, error: allError } = await supabase
      .from("bookings")
      .select("*")
      .order("createdAt", { ascending: false });

    console.log("Total bookings in database:", allBookings?.length || 0);

    // Get bookings for this user
    let userBookings = [];
    if (userId) {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });

      userBookings = data || [];
      console.log(`Bookings for user ${userId}:`, userBookings.length);
    }

    // Get a sample of all users to check IDs
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .limit(10);

    // Get a sample of all events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, name")
      .limit(10);

    return NextResponse.json({
      totalBookings: allBookings?.length || 0,
      userBookingsCount: userBookings.length,
      allBookings: allBookings?.map((b) => ({
        id: b.id,
        userId: b.userId,
        eventId: b.eventId,
        status: b.status,
        paymentId: b.paymentId,
        createdAt: b.createdAt,
      })),
      userBookings: userBookings.map((b) => ({
        id: b.id,
        userId: b.userId,
        eventId: b.eventId,
        status: b.status,
        paymentId: b.paymentId,
        createdAt: b.createdAt,
      })),
      sampleUsers: users?.map((u) => ({ id: u.id, email: u.email })),
      sampleEvents: events?.map((e) => ({ id: e.id, name: e.name })),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
