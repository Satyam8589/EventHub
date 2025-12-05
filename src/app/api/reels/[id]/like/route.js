import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST - Toggle like on a reel
export async function POST(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { userId } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Reel ID and User ID are required" },
        { status: 400 }
      );
    }

    // Check if user already liked this reel
    const { data: existingLike } = await supabase
      .from("reel_likes")
      .select("id")
      .eq("reel_id", id)
      .eq("user_id", userId)
      .single();

    if (existingLike) {
      // Unlike - remove the like
      await supabase
        .from("reel_likes")
        .delete()
        .eq("reel_id", id)
        .eq("user_id", userId);

      // Decrement likes_count
      const { data: currentReel } = await supabase
        .from("reels")
        .select("likes_count")
        .eq("id", id)
        .single();
      
      const { data: reel } = await supabase
        .from("reels")
        .update({ likes_count: Math.max(0, (currentReel?.likes_count || 0) - 1) })
        .eq("id", id)
        .select("likes_count")
        .single();

      return NextResponse.json({ 
        liked: false,
        likes_count: reel?.likes_count || 0
      });
    } else {
      // Like - add the like
      await supabase
        .from("reel_likes")
        .insert([{ reel_id: id, user_id: userId }]);

      // Increment likes_count
      const { data: currentReel } = await supabase
        .from("reels")
        .select("likes_count")
        .eq("id", id)
        .single();
      
      const { data: reel } = await supabase
        .from("reels")
        .update({ likes_count: (currentReel?.likes_count || 0) + 1 })
        .eq("id", id)
        .select("likes_count")
        .single();

      return NextResponse.json({ 
        liked: true,
        likes_count: reel?.likes_count || 1
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
