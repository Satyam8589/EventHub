import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE /api/push/cleanup - Remove invalid/failed subscriptions
export async function DELETE(request) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "endpoint is required" },
        { status: 400 }
      );
    }

    // Delete the subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) {
      console.error("Error deleting subscription:", error);
      return NextResponse.json(
        { error: "Failed to delete subscription", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription removed successfully",
    });
  } catch (error) {
    console.error("Error in cleanup:", error);
    return NextResponse.json(
      { error: "Failed to cleanup subscription", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/push/cleanup - Automatically clean up all invalid subscriptions for a user
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get all user subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscriptions found",
        removed: 0,
      });
    }

    // Test each subscription by sending a dummy notification
    const { sendPushNotificationToMultiple } = await import(
      "@/lib/pushNotification"
    );

    const testPayload = {
      title: "Connection Test",
      message: "Testing subscription validity",
      tag: "test-validity",
    };

    const pushSubscriptions = subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));

    const results = await sendPushNotificationToMultiple(
      pushSubscriptions,
      testPayload
    );

    // Collect failed subscriptions that should be removed
    const toRemove = [];
    results.results.forEach((result, index) => {
      if (
        result.status === "fulfilled" &&
        !result.value.success &&
        result.value.shouldRemove
      ) {
        toRemove.push(subscriptions[index].endpoint);
      }
    });

    // Remove invalid subscriptions
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", toRemove);

      if (deleteError) {
        console.error("Error deleting invalid subscriptions:", deleteError);
        return NextResponse.json(
          { error: "Failed to cleanup", details: deleteError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${toRemove.length} invalid subscription(s)`,
      total: subscriptions.length,
      removed: toRemove.length,
      remaining: subscriptions.length - toRemove.length,
      invalidEndpoints: toRemove,
    });
  } catch (error) {
    console.error("Error in auto cleanup:", error);
    return NextResponse.json(
      { error: "Failed to auto cleanup", details: error.message },
      { status: 500 }
    );
  }
}
