import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("Testing bookings table...");

    // Get ALL bookings
    const { data: allBookings, error } = await supabase
      .from("bookings")
      .select("*")
      .limit(10);

    console.log("Total bookings in database:", allBookings?.length || 0);

    if (allBookings && allBookings.length > 0) {
      console.log(
        "First booking structure:",
        JSON.stringify(allBookings[0], null, 2)
      );
      console.log("All booking fields:", Object.keys(allBookings[0]));
    }

    return NextResponse.json({
      success: true,
      totalBookings: allBookings?.length || 0,
      bookings: allBookings,
      firstBookingFields: allBookings?.[0] ? Object.keys(allBookings[0]) : [],
      error: error,
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
