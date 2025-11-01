import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/events/[id]/attendees - Get top 5 different users who booked
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Get ALL bookings for this event (any status)
    const { data: allBookings, error } = await supabase
      .from("bookings")
      .select("userId, createdAt, status")
      .eq("eventId", id)
      .order("createdAt", { ascending: false });

    if (error) {
      return NextResponse.json({ attendees: [], total: 0 });
    }

    const totalBookings = allBookings?.length || 0;

    if (totalBookings === 0) {
      return NextResponse.json({ attendees: [], total: 0 });
    }

    // Get first 5 unique users (different users only)
    const uniqueUsers = [];
    const seenUserIds = new Set();

    for (const booking of allBookings) {
      if (!seenUserIds.has(booking.userId) && uniqueUsers.length < 5) {
        uniqueUsers.push(booking);
        seenUserIds.add(booking.userId);
      }
    }

    // Fetch user details for the unique users
    const userIds = uniqueUsers.map((u) => u.userId);
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email, avatar")
      .in("id", userIds);

    // Create attendees list
    const attendees = uniqueUsers.map((booking, index) => {
      const user = users?.find((u) => u.id === booking.userId);

      return {
        userId: booking.userId,
        name: user?.name || user?.email?.split("@")[0] || `User ${index + 1}`,
        email: user?.email || "",
        avatar: user?.avatar || "",
        bookedAt: booking.createdAt,
      };
    });

    return NextResponse.json({
      attendees: attendees,
      total: seenUserIds.size, // Total unique users, not total bookings
    });
  } catch (error) {
    console.error("Error in attendees API:", error);
    return NextResponse.json({ attendees: [], total: 0 }, { status: 500 });
  }
}
