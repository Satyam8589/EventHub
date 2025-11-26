import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE /api/push/cleanup-all - Remove ALL push subscriptions (for VAPID key changes)
export async function DELETE(request) {
  try {
    const { userId, confirmDelete } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!confirmDelete) {
      return NextResponse.json(
        { error: "confirmDelete must be true" },
        { status: 400 }
      );
    }

    // Delete ALL subscriptions for this user
    const { error, count } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting all subscriptions:", error);
      return NextResponse.json(
        { error: "Failed to delete subscriptions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `All subscriptions deleted successfully`,
      deletedCount: count || 0,
    });
  } catch (error) {
    console.error("Error in cleanup-all:", error);
    return NextResponse.json(
      { error: "Failed to cleanup", details: error.message },
      { status: 500 }
    );
  }
}
