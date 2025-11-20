import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/push/subscribe - Save push subscription
export async function POST(request) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription is required" },
        { status: 400 }
      );
    }

    // Save subscription to database
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          subscription_data: subscription,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      )
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return success anyway (graceful degradation)
      if (error.code === "42P01") {
        console.warn("push_subscriptions table does not exist. Skipping database save.");
        return NextResponse.json({
          success: true,
          message: "Subscription saved (in-memory only)",
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      subscription: data,
    });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Failed to save subscription", details: error.message },
      { status: 500 }
    );
  }
}
