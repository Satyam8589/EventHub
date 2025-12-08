import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch comments for a reel
export async function GET(request, context) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Reel ID is required" },
        { status: 400 }
      );
    }

    // Fetch comments
    const { data: comments, error } = await supabase
      .from("reel_comments")
      .select("*")
      .eq("reel_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments", comments: [] },
        { status: 200 }
      );
    }

    // Fetch user data for each comment
    const commentsWithUsers = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: user } = await supabase
          .from("users")
          .select("id, email, name, username, avatar")
          .eq("id", comment.user_id)
          .single();

        return {
          ...comment,
          users: user || {
            id: comment.user_id,
            email: "Unknown",
            name: "Anonymous",
            username: null,
            avatar: null,
          },
        };
      })
    );

    return NextResponse.json({
      comments: commentsWithUsers,
      count: commentsWithUsers.length,
    });
  } catch (error) {
    console.error("Error in GET /api/reels/[id]/comments:", error);
    return NextResponse.json(
      { error: "Internal server error", comments: [] },
      { status: 200 }
    );
  }
}

// POST - Add a comment to a reel
export async function POST(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { userId, comment } = body;

    if (!id || !userId || !comment) {
      return NextResponse.json(
        { error: "Reel ID, User ID, and comment are required" },
        { status: 400 }
      );
    }

    // Insert comment
    const { data: newComment, error } = await supabase
      .from("reel_comments")
      .insert([
        {
          reel_id: id,
          user_id: userId,
          comment: comment.trim(),
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    // Increment comments_count on the reel
    const { data: currentReel } = await supabase
      .from("reels")
      .select("comments_count")
      .eq("id", id)
      .single();

    await supabase
      .from("reels")
      .update({ comments_count: (currentReel?.comments_count || 0) + 1 })
      .eq("id", id);

    // Fetch user data
    const { data: user } = await supabase
      .from("users")
      .select("id, email, name, username, avatar")
      .eq("id", newComment.user_id)
      .single();

    return NextResponse.json(
      {
        comment: {
          ...newComment,
          users: user || {
            id: newComment.user_id,
            email: "Unknown",
            name: "Anonymous",
            username: null,
            avatar: null,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/reels/[id]/comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
