import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Get followers/following for a user or check if following
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // 'followers' | 'following'
    const checkFollowing = searchParams.get("checkFollowing"); // userId to check if current user follows
    const currentUserId = searchParams.get("currentUserId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Check if current user is following a specific user
    if (checkFollowing && currentUserId) {
      const { data, error } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", checkFollowing)
        .single();

      return NextResponse.json({
        isFollowing: !!data && !error,
      });
    }

    // Get followers count and following count
    const { count: followersCount } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: followingCount } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    // Get detailed list if requested
    let users = [];
    if (type === "followers" || type === "following") {
      const column = type === "followers" ? "following_id" : "follower_id";
      const userIdColumn =
        type === "followers" ? "follower_id" : "following_id";

      const { data: followData, error } = await supabase
        .from("followers")
        .select("*")
        .eq(column, userId)
        .order("created_at", { ascending: false });

      if (!error && followData) {
        // Fetch user details
        const userIds = followData.map((f) => f[userIdColumn]);
        const { data: userData } = await supabase
          .from("users")
          .select("id, name, email, username, avatar")
          .in("id", userIds);

        // Fetch reel counts for each user
        if (userData) {
          const usersWithReelCounts = await Promise.all(
            userData.map(async (user) => {
              const { count: reelCount } = await supabase
                .from("reels")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id);

              return {
                ...user,
                photoURL: user.avatar,
                reelCount: reelCount || 0,
              };
            })
          );
          users = usersWithReelCounts;
        }
      }
    }

    return NextResponse.json({
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      users,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}

// POST - Follow a user
export async function POST(request) {
  try {
    const body = await request.json();
    const { followerId, followingId } = body;

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: "followerId and followingId are required" },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("followers")
      .insert([
        {
          follower_id: followerId,
          following_id: followingId,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Already following this user" },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// DELETE - Unfollow a user
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get("followerId");
    const followingId = searchParams.get("followingId");

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: "followerId and followingId are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
