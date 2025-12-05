import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// DELETE - Delete a specific comment
export async function DELETE(request, context) {
  try {
    const { id, commentId } = await context.params;

    if (!id || !commentId) {
      return NextResponse.json(
        { error: "Reel ID and Comment ID are required" },
        { status: 400 }
      );
    }

    // Delete the comment
    const { error } = await supabase
      .from("reel_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    // Decrement comments_count on the reel
    const { data: currentReel } = await supabase
      .from("reels")
      .select("comments_count")
      .eq("id", id)
      .single();
    
    await supabase
      .from("reels")
      .update({ comments_count: Math.max(0, (currentReel?.comments_count || 0) - 1) })
      .eq("id", id);

    return NextResponse.json({ 
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    console.error("Error in DELETE /api/reels/[id]/comments/[commentId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
