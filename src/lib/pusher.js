import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
let pusherServer = null;

export const getPusherServer = () => {
  if (typeof window !== "undefined") return null;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

  if (!appId || !key || !secret) {
    return null;
  }

  if (!pusherServer) {
    try {
      pusherServer = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
    } catch (e) {
      console.warn("Failed to initialize Pusher server:", e.message);
      return null;
    }
  }
  return pusherServer;
};

// Client-side Pusher instance
let pusherClient = null;

export const getPusherClient = () => {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!key) return null;

  if (!pusherClient) {
    try {
      pusherClient = new PusherClient(key, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
        forceTLS: true,
      });
    } catch (e) {
      console.warn("Failed to initialize Pusher client:", e.message);
      return null;
    }
  }
  return pusherClient;
};

// Event types for notifications
export const NOTIFICATION_EVENTS = {
  NEW_EVENT: "new-event",
  LOW_TICKETS: "low-tickets",
  EVENT_ONGOING: "event-ongoing",
  EVENT_UPDATED: "event-updated",
  BOOKING_CONFIRMED: "booking-confirmed",
  PAYMENT_SUCCESS: "payment-success",
  PAYMENT_PENDING: "payment-pending",
  PAYMENT_FAILED: "payment-failed",
};

// Helper function to sanitize payload to avoid WS_ERR_UNSUPPORTED_MESSAGE_LENGTH / 10KB Pusher limit
function sanitizePayload(data) {
  if (!data || typeof data !== "object") return data;

  const clean = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      // Strip large base64 image strings from notifications
      if (value.startsWith("data:image/") || value.length > 2000) {
        clean[key] = value.startsWith("http") ? value : undefined;
      } else {
        clean[key] = value;
      }
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitizePayload(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// Helper function to trigger notifications safely
export const triggerNotification = async (channel, event, data) => {
  try {
    const pusher = getPusherServer();
    if (!pusher) {
      return;
    }

    const payload = sanitizePayload(data);
    const payloadStr = JSON.stringify(payload);

    // Pusher channel limit is 10 KB (10,240 bytes)
    if (payloadStr.length > 9500) {
      console.warn(
        `Pusher payload too large (${payloadStr.length} bytes), skipping to prevent WS error.`
      );
      return;
    }

    await pusher.trigger(channel, event, payload);
    console.log(`Notification sent: ${event} on ${channel}`);
  } catch (error) {
    console.error("Failed to send Pusher notification:", error.message || error);
  }
};
