import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendPushNotificationToMultiple } from "@/lib/pushNotification";

// POST /api/push/send - Send push notification to all subscribers
export async function POST(request) {
  try {
    const { title, message, icon, image, data, tag } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    // Get all active subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) {
      // If table doesn't exist, return gracefully
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          message: "No subscriptions table found",
          sent: 0,
        });
      }
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscriptions",
        sent: 0,
      });
    }

    // Convert database subscriptions to push subscription format
    const pushSubscriptions = subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));

    // Send push notifications
    const result = await sendPushNotificationToMultiple(pushSubscriptions, {
      title,
      message,
      icon,
      image,
      data,
      tag,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return NextResponse.json(
      { error: "Failed to send push notifications", details: error.message },
      { status: 500 }
    );
  }
}
