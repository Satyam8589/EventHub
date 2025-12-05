import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// DELETE - Delete a specific reel
export async function DELETE(request, context) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Reel ID is required" },
        { status: 400 }
      );
    }

    // Delete the reel
    const { error } = await supabase
      .from("reels")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting reel:", error);
      return NextResponse.json(
        { error: "Failed to delete reel" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Reel deleted successfully"
    });
  } catch (error) {
    console.error("Error in DELETE /api/reels/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
