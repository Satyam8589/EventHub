import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
let pusherServer = null;

export const getPusherServer = () => {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusherServer;
};

// Client-side Pusher instance
let pusherClient = null;

export const getPusherClient = () => {
  if (typeof window === "undefined") return null;

  if (!pusherClient) {
    pusherClient = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY || "",
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
        forceTLS: true,
      }
    );
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
  PAYMENT_FAILED: "payment-failed",
};

// Helper function to trigger notifications
export const triggerNotification = async (channel, event, data) => {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(channel, event, data);
    console.log(`Notification sent: ${event} on ${channel}`);
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};
