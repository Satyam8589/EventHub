import { sendPushNotificationToMultiple } from "./pushNotification";
import { supabase } from "./supabase";

/**
 * Send Web Push notification to specific user(s)
 * @param {string} event - Event type
 * @param {Object} data - Notification data
 * @param {Object} options - Additional options (userId, userIds, sendToAll)
 */
export async function sendPushNotification(event, data, options = {}) {
  try {
    // Get notification content based on event type
    const notificationContent = getNotificationContent(event, data);

    // Determine which users to notify
    let subscriptions = [];

    if (options.userId) {
      // Send to specific user
      const { data: userSubs } = await supabase
        .from("push_subscriptions")
        .select("endpoint,p256dh,auth")
        .eq("user_id", options.userId);
      subscriptions = userSubs || [];
    } else if (options.userIds && Array.isArray(options.userIds)) {
      // Send to multiple specific users
      const { data: userSubs } = await supabase
        .from("push_subscriptions")
        .select("endpoint,p256dh,auth")
        .in("user_id", options.userIds);
      subscriptions = userSubs || [];
    } else if (options.sendToAll) {
      // Send to all subscribed users
      const { data: allSubs } = await supabase
        .from("push_subscriptions")
        .select("endpoint,p256dh,auth");
      subscriptions = allSubs || [];
    }

    if (subscriptions.length === 0) {
      console.log("No push subscriptions found for notification");
      return { success: true, sent: 0 };
    }

    // Convert to push subscription format
    const pushSubscriptions = subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));

    // Send push notifications
    const result = await sendPushNotificationToMultiple(pushSubscriptions, {
      title: notificationContent.title,
      message: notificationContent.message,
      icon: notificationContent.icon,
      data: notificationContent.data,
      tag: notificationContent.tag,
      requireInteraction: notificationContent.requireInteraction,
    });

    console.log(`Sent push notification to ${pushSubscriptions.length} subscribers`);
    return { success: true, sent: pushSubscriptions.length, result };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get notification content based on event type
 * @param {string} event - Event type
 * @param {Object} data - Event data
 * @returns {Object} Notification content
 */
function getNotificationContent(event, data) {
  const eventTitle = data.eventTitle || data.title || "Event";
  
  const contentMap = {
    "new-event": {
      title: "🎉 New Event Available!",
      message: `${eventTitle} has been posted. Book your tickets now!`,
      icon: "/icon-192.png",
      tag: "new-event",
      data: { url: `/events/${data.eventId}` },
      requireInteraction: false,
    },
    "low-tickets": {
      title: "⚠️ Limited Tickets!",
      message: `Only ${data.remainingTickets} tickets left for ${eventTitle}. Hurry!`,
      icon: "/icon-192.png",
      tag: "low-tickets",
      data: { url: `/events/${data.eventId}` },
      requireInteraction: true,
    },
    "event-ongoing": {
      title: "🔴 Event Now Live!",
      message: `${eventTitle} is now ongoing. Don't miss out!`,
      icon: "/icon-192.png",
      tag: "event-ongoing",
      data: { url: `/events/${data.eventId}` },
      requireInteraction: false,
    },
    "event-updated": {
      title: "📝 Event Updated",
      message: `${eventTitle} has been updated. Check the latest details.`,
      icon: "/icon-192.png",
      tag: "event-updated",
      data: { url: `/events/${data.eventId}` },
      requireInteraction: false,
    },
    "booking-confirmed": {
      title: "✅ Booking Confirmed!",
      message: `Thank you! Your booking for ${eventTitle} is confirmed.`,
      icon: "/icon-192.png",
      tag: "booking-confirmed",
      data: { url: `/my-events` },
      requireInteraction: false,
    },
    "payment-success": {
      title: "💳 Payment Successful!",
      message: `Your payment for ${eventTitle} was successful. Enjoy the event!`,
      icon: "/icon-192.png",
      tag: "payment-success",
      data: { url: `/my-events` },
      requireInteraction: false,
    },
    "payment-pending": {
      title: "⏳ Payment Pending",
      message: `Your payment for ${eventTitle} is being processed. We'll notify you once confirmed.`,
      icon: "/icon-192.png",
      tag: "payment-pending",
      data: { url: `/my-events` },
      requireInteraction: false,
    },
    "payment-failed": {
      title: "❌ Payment Failed",
      message: `Your payment for ${eventTitle} failed. Please try again.`,
      icon: "/icon-192.png",
      tag: "payment-failed",
      data: { url: `/events/${data.eventId}` },
      requireInteraction: true,
    },
  };

  return (
    contentMap[event] || {
      title: "EventHub Notification",
      message: "You have a new notification",
      icon: "/icon-192.png",
      tag: "general",
      data: { url: "/" },
      requireInteraction: false,
    }
  );
}

/**
 * Send notification to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event type
 * @param {Object} data - Notification data
 */
export async function sendNotificationToUser(userId, event, data) {
  return sendPushNotification(event, data, { userId });
}

/**
 * Send notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {string} event - Event type
 * @param {Object} data - Notification data
 */
export async function sendNotificationToUsers(userIds, event, data) {
  return sendPushNotification(event, data, { userIds });
}

/**
 * Send notification to all users
 * @param {string} event - Event type
 * @param {Object} data - Notification data
 */
export async function sendNotificationToAll(event, data) {
  return sendPushNotification(event, data, { sendToAll: true });
}
