import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/push/unsubscribe - Remove push subscription
export async function POST(request) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Subscription endpoint is required" },
        { status: 400 }
      );
    }

    // Remove subscription from database
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", subscription.endpoint);

    if (error) {
      // If table doesn't exist, return success anyway
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          message: "Subscription removed",
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Subscription removed successfully",
    });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription", details: error.message },
      { status: 500 }
    );
  }
}
