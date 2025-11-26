import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendPushNotificationToMultiple } from "@/lib/pushNotification";

// POST /api/push/test - Send a test push notification to current user
export async function POST(request) {
  try {
    const { userId } = await request.json();

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

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        {
          error: "No subscriptions found for this user",
          message: "Please subscribe first using the Subscribe button",
        },
        { status: 404 }
      );
    }

    // Convert to push subscription format
    const pushSubscriptions = subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));

    // Send test notification
    const result = await sendPushNotificationToMultiple(pushSubscriptions, {
      title: "🎉 Test Notification",
      message: "If you can see this, push notifications are working perfectly!",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: "/test-push",
        type: "test",
      },
      tag: `test-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      message: "Test notification sent!",
      subscriptionsFound: subscriptions.length,
      result: result,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { error: "Failed to send test notification", details: error.message },
      { status: 500 }
    );
  }
}
