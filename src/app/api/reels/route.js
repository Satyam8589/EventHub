import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotificationToMultiple } from "@/lib/pushNotification";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch reels from database with optional tag filter
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("reels")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user ID if provided
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // Filter by tag if provided
    if (tag && tag !== "all") {
      query = query.contains("tags", [tag]);
    }

    const { data: reels, error } = await query;

    if (error) {
      console.error("Error fetching reels:", error);
      return NextResponse.json(
        { error: "Failed to fetch reels", reels: [] },
        { status: 200 }
      );
    }

    // Fetch user data separately for each reel
    const reelsWithUsers = await Promise.all(
      (reels || []).map(async (reel) => {
        const { data: user } = await supabase
          .from("users")
          .select("id, email, name, username, avatar")
          .eq("id", reel.user_id)
          .single();

        return {
          ...reel,
          users: user || {
            id: reel.user_id,
            email: "Unknown",
            name: "Anonymous",
            username: null,
          },
        };
      })
    );

    return NextResponse.json({
      reels: reelsWithUsers,
      source: "database",
      count: reelsWithUsers.length,
    });
  } catch (error) {
    console.error("Error in GET /api/reels:", error);
    return NextResponse.json(
      { error: "Internal server error", reels: [] },
      { status: 200 }
    );
  }
}

// POST - Create a new reel
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, title, description, mediaUrl, mediaType, tags } = body;

    if (!userId || !title || !mediaUrl) {
      return NextResponse.json(
        { error: "Missing required fields: userId, title, mediaUrl" },
        { status: 400 }
      );
    }

    const { data: reel, error } = await supabase
      .from("reels")
      .insert([
        {
          user_id: userId,
          title,
          description: description || "",
          media_url: mediaUrl,
          media_type: mediaType || "image",
          tags: tags || [],
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Error creating reel:", error);
      return NextResponse.json(
        { error: "Failed to create reel" },
        { status: 500 }
      );
    }

    // Fetch user data separately
    const { data: user } = await supabase
      .from("users")
      .select("id, email, name, username, avatar")
      .eq("id", reel.user_id)
      .single();

    // Send push notifications to followers
    try {
      // Get all followers of the user who posted the reel
      const { data: followers } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("following_id", userId);

      if (followers && followers.length > 0) {
        // Get push subscriptions for all followers
        const followerIds = followers.map((f) => f.follower_id);
        const { data: subscriptions } = await supabase
          .from("push_subscriptions")
          .select("subscription")
          .in("user_id", followerIds);

        if (subscriptions && subscriptions.length > 0) {
          // Send push notification to all followers
          const username = user?.username || user?.name || "A user";
          await sendPushNotificationToMultiple(
            subscriptions.map((s) => s.subscription),
            {
              title: "New Reel Posted! 🎬",
              message: `${username} just posted a new reel: ${title}`,
              icon: user?.avatar || "/icon-192.png",
              badge: "/icon-192.png",
              tag: `new-reel-${reel.id}`,
              data: {
                type: "new_reel",
                reelId: reel.id,
                userId: userId,
                url: "/reels",
              },
            }
          );
        }
      }
    } catch (notificationError) {
      console.error(
        "Error sending notifications to followers:",
        notificationError
      );
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(
      {
        reel: {
          ...reel,
          users: user || {
            id: reel.user_id,
            email: "Unknown",
            name: "Anonymous",
            username: null,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/reels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
