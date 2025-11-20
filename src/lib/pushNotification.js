import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:join.eventhub@gmail.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * Send a push notification to a subscription
 * @param {Object} subscription - Push subscription object
 * @param {Object} payload - Notification payload
 */
export async function sendPushNotification(subscription, payload) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured. Push notifications disabled.');
      return { success: false, error: 'VAPID keys not configured', endpoint: subscription.endpoint };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || 'EventHub Notification',
      message: payload.message || payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      image: payload.image,
      tag: payload.tag || 'eventhub-notification',
      requireInteraction: payload.requireInteraction || false,
      data: payload.data || {},
      actions: payload.actions || []
    });

    const result = await webpush.sendNotification(
      subscription,
      notificationPayload
    );

    return { success: true, result, endpoint: subscription.endpoint };
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // Check if subscription is no longer valid (410 Gone or 404 Not Found)
    const isInvalidSubscription = error.statusCode === 410 || error.statusCode === 404;
    
    return { 
      success: false, 
      error: error.message, 
      endpoint: subscription.endpoint,
      shouldRemove: isInvalidSubscription // Flag to remove from database
    };
  }
}

/**
 * Send push notifications to multiple subscriptions
 * @param {Array} subscriptions - Array of push subscription objects
 * @param {Object} payload - Notification payload
 */
export async function sendPushNotificationToMultiple(subscriptions, payload) {
  const results = await Promise.allSettled(
    subscriptions.map(subscription => sendPushNotification(subscription, payload))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  return {
    total: results.length,
    successful,
    failed,
    results
  };
}

/**
 * Generate VAPID keys (run this once to generate keys)
 */
export function generateVapidKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('VAPID Public Key:', vapidKeys.publicKey);
  console.log('VAPID Private Key:', vapidKeys.privateKey);
  return vapidKeys;
}
