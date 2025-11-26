import { NextResponse } from "next/server";

// GET /api/push/vapid-key - Get public VAPID key
export async function GET() {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;

    if (!vapidPublicKey) {
      console.error("VAPID public key not configured in environment variables");
      return NextResponse.json(
        { error: "Push notifications not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      publicKey: vapidPublicKey,
    });
  } catch (error) {
    console.error("Error getting VAPID key:", error);
    return NextResponse.json(
      { error: "Failed to get VAPID key" },
      { status: 500 }
    );
  }
}
