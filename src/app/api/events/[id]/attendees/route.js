import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/events/[id]/attendees - Get attendees for an event
export async function GET(request, { params }) {
  try {
    const { id } = params;

    console.log("===========================================");
    console.log("ATTENDEES API CALLED FOR EVENT:", id);
    console.log("===========================================");

    // Fetch CONFIRMED bookings with user information
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        users:userId (
          id,
          name,
          email,
          avatar
        )
      `)
      .eq("eventId", id)
      .eq("status", "CONFIRMED")
      .order("createdAt", { ascending: false })
      .limit(10);

    console.log("CONFIRMED bookings found:", bookings?.length || 0);
    if (bookings && bookings.length > 0) {
      console.log("First booking with user:", JSON.stringify(bookings[0], null, 2));
    }

    if (error) {
      console.error("Error fetching bookings:", error);
      return NextResponse.json({ attendees: [], total: 0 });
    }

    if (!bookings || bookings.length === 0) {
      console.log("No confirmed bookings found");
      return NextResponse.json({ attendees: [], total: 0 });
    }

    // Extract attendee information from bookings with user data
    const attendees = bookings.slice(0, 5).map((booking, index) => {
      const user = booking.users;
      
      return {
        userId: booking.userId,
        name: user?.name || user?.email?.split('@')[0] || `User ${index + 1}`,
        email: user?.email || '',
        avatar: user?.avatar || '',
        bookedAt: booking.createdAt,
      };
    });

    console.log("Processed attendees:", attendees);

    return NextResponse.json({
      attendees: attendees,
      total: bookings.length,
    });
  } catch (error) {
    console.error("Error in GET /api/events/[id]/attendees:", error);
    return NextResponse.json({ attendees: [], total: 0 }, { status: 500 });
  }
}
