import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch all reels liked by a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch all liked reels for this user
    const { data: likes, error } = await supabase
      .from("reel_likes")
      .select("reel_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching liked reels:", error);
      return NextResponse.json(
        { error: "Failed to fetch liked reels", likedReels: [] },
        { status: 200 }
      );
    }

    // Extract just the reel IDs
    const likedReels = (likes || []).map((like) => like.reel_id);

    return NextResponse.json({
      likedReels,
      count: likedReels.length,
    });
  } catch (error) {
    console.error("Error in GET /api/reels/liked:", error);
    return NextResponse.json(
      { error: "Internal server error", likedReels: [] },
      { status: 200 }
    );
  }
}
