import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const userId = searchParams.get("userId");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the requesting user is a SUPER_ADMIN
    const { data: requestingUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (!requestingUser || requestingUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin access required" },
        { status: 403 }
      );
    }

    // Find user by username
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch user's reels
    const { data: reels } = await supabase
      .from("reels")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch user's bookings with event details
    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        *,
        event:events(title, date, time, location)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Calculate statistics
    const totalReels = reels?.length || 0;
    const totalLikes = reels?.reduce((sum, reel) => sum + (reel.likes_count || 0), 0) || 0;
    const totalComments = reels?.reduce((sum, reel) => sum + (reel.comments_count || 0), 0) || 0;
    const totalBookings = bookings?.length || 0;

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          created_at: user.created_at,
        },
        stats: {
          totalReels,
          totalLikes,
          totalComments,
          totalBookings,
        },
        reels: reels || [],
        bookings: bookings || [],
      },
    });
  } catch (error) {
    console.error("Error in user lookup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
