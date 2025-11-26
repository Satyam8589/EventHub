import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/push/check - Check push subscriptions for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: subscriptions?.length || 0,
      subscriptions: subscriptions || [],
      message:
        subscriptions?.length > 0
          ? `Found ${subscriptions.length} subscription(s)`
          : "No subscriptions found",
    });
  } catch (error) {
    console.error("Error checking subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to check subscriptions", details: error.message },
      { status: 500 }
    );
  }
}
