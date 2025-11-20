# EventHub Notification System Analysis

**Date:** 2025-11-20  
**Status:** ⚠️ **PARTIALLY FUNCTIONAL - CRITICAL ISSUES FOUND**

---

## Executive Summary

Your notification system has **two separate notification mechanisms** that are **NOT properly integrated**:

1. **Real-time Notifications (Pusher)** - ✅ Implemented but NOT used in layout
2. **Push Notifications (Web Push API)** - ✅ Implemented and partially integrated

### Critical Issues Found

❌ **Issue #1: NotificationProvider Not Wrapped in Layout**
- The `NotificationProvider` context exists but is **NOT wrapping your app** in `layout.js`
- This means real-time notifications via Pusher **will not work**
- Users won't receive in-app toast notifications for events

❌ **Issue #2: NotificationBell Component Not Used**
- The `NotificationBell` component exists but is **never imported or rendered**
- Users have no way to view notification history

❌ **Issue #3: Missing Database Table**
- The `push_subscriptions` table SQL migration exists but may not be applied
- Without this table, push notification subscriptions cannot be stored

⚠️ **Issue #4: Push Notifications Only on Home Page**
- Push notification toggle only appears on the home page (`pathname === "/"`)
- Users can't manage notifications from other pages

⚠️ **Issue #5: No Integration Between Systems**
- Pusher notifications and Push notifications work independently
- When a Pusher event fires, it doesn't trigger a push notification

---

## System Architecture

### 1. Real-Time Notifications (Pusher)

**Files:**
- `src/lib/pusher.js` - Pusher client/server setup
- `src/contexts/NotificationContext.js` - React context for notifications
- `src/components/NotificationBell.js` - UI component (unused)

**How it works:**
```
Server Event → Pusher Server → Pusher Client → NotificationContext → Toast
```

**Supported Events:**
- `new-event` - New event created
- `low-tickets` - Low ticket availability
- `event-ongoing` - Event started
- `event-updated` - Event details changed
- `booking-confirmed` - Booking successful
- `payment-failed` - Payment failed

**Current Status:** ❌ NOT WORKING
- Context provider not in layout
- No UI to view notification history

### 2. Push Notifications (Web Push API)

**Files:**
- `src/lib/pushNotification.js` - Server-side push sending
- `src/hooks/usePushNotifications.js` - Client-side subscription management
- `src/components/PushNotificationToggle.js` - UI toggle
- `public/sw.js` - Service worker
- `src/app/api/push/subscribe/route.js` - Subscribe endpoint
- `src/app/api/push/unsubscribe/route.js` - Unsubscribe endpoint
- `src/app/api/push/send/route.js` - Send notification endpoint

**How it works:**
```
Server Event → API Call → web-push → Browser → Service Worker → Notification
```

**Current Status:** ⚠️ PARTIALLY WORKING
- Toggle appears on home page only
- Database table may not exist
- Not integrated with Pusher events

---

## Detailed Analysis

### ✅ What's Working

1. **Service Worker Registration**
   - `public/sw.js` properly handles push events
   - Notification click handling implemented
   - Vibration and visual feedback configured

2. **VAPID Keys Configuration**
   - Environment variables properly set up
   - `web-push` library configured correctly

3. **Push Subscription Management**
   - Subscribe/unsubscribe hooks implemented
   - Graceful degradation if table doesn't exist

4. **Event Status Checker**
   - `useEventStatusChecker` hook runs every 5 minutes
   - Calls `/api/cron/check-ongoing-events` to update event statuses

5. **Notification Triggers**
   - Events API triggers notifications on:
     - New event creation
     - Low ticket warnings
   - Payment API triggers notifications on:
     - Booking confirmation
     - Payment failure
   - Cron API triggers notifications on:
     - Event going live

### ❌ What's Broken

#### 1. NotificationProvider Not in Layout

**Problem:**
```javascript
// src/app/layout.js - Current
<AuthProvider>
  {children}
  <Toaster />
</AuthProvider>

// Should be:
<AuthProvider>
  <NotificationProvider>  // ← MISSING
    {children}
    <Toaster />
  </NotificationProvider>
</AuthProvider>
```

**Impact:**
- Pusher notifications won't work
- `useNotifications()` hook will fail
- No toast notifications for real-time events

#### 2. NotificationBell Not Rendered

**Problem:**
- Component exists but never imported in Navbar or any other component
- Users can't see notification history

**Should be added to:**
```javascript
// src/components/Navbar.js
import NotificationBell from "./NotificationBell";

// In the navbar:
<NotificationBell />
```

#### 3. Database Table Missing

**Problem:**
- Migration file exists: `supabase_migrations/create_push_subscriptions_table.sql`
- But may not be applied to database

**Check with:**
```sql
SELECT * FROM push_subscriptions LIMIT 1;
```

**If error, run:**
```sql
-- From create_push_subscriptions_table.sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  subscription_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. No Integration Between Systems

**Problem:**
- When `triggerNotification()` is called (Pusher), it doesn't send push notifications
- When push notifications are sent, they don't appear in Pusher

**Example from events API:**
```javascript
// Current - Only Pusher
await triggerNotification("events", NOTIFICATION_EVENTS.NEW_EVENT, {...});

// Should also send push notification:
await sendPushNotificationToMultiple(subscriptions, {...});
```

---

## Environment Variables Required

### Current Setup
```env
# Pusher (Real-time)
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=mailto:join.eventhub@gmail.com

# Cron (Optional)
CRON_SECRET=your_secret
```

### Verification
Check if VAPID keys are set:
```javascript
// In browser console on home page
console.log(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
```

---

## Notification Flow Analysis

### Current Flow (Broken)

1. **New Event Created:**
   ```
   POST /api/events
   → triggerNotification("events", "new-event", data)
   → Pusher sends to channel "events"
   → NotificationContext receives (IF wrapped)
   → Toast appears (IF wrapped)
   ```
   ❌ **Result:** No toast because NotificationProvider not in layout

2. **Push Notification:**
   ```
   User clicks toggle
   → usePushNotifications.subscribe()
   → Service worker registers
   → Subscription saved to DB (IF table exists)
   → User subscribed
   ```
   ⚠️ **Result:** Subscription works but table might not exist

3. **Sending Push:**
   ```
   Server event occurs
   → Currently: Only Pusher notification sent
   → Should: Also call /api/push/send
   → web-push sends to all subscriptions
   → Service worker shows notification
   ```
   ❌ **Result:** Push notifications never sent from events

### Expected Flow (Fixed)

1. **New Event Created:**
   ```
   POST /api/events
   → triggerNotification() (Pusher)
   → sendPushNotificationToMultiple() (Web Push)
   → Both systems notify users
   ```

2. **User Receives:**
   ```
   Pusher → In-app toast (if user is on site)
   Web Push → Browser notification (even if user is away)
   ```

---

## Testing Checklist

### ✅ Tests to Run

1. **Check Database Table:**
   ```sql
   SELECT * FROM push_subscriptions;
   ```

2. **Check VAPID Keys:**
   ```bash
   # In project root
   node generate-vapid-keys.js
   ```

3. **Test Pusher Connection:**
   ```javascript
   // Browser console
   const pusher = new PusherClient('your_key', { cluster: 'ap2' });
   const channel = pusher.subscribe('events');
   channel.bind('new-event', (data) => console.log('Received:', data));
   ```

4. **Test Push Subscription:**
   - Go to home page
   - Click push notification toggle
   - Check browser DevTools → Application → Service Workers
   - Check browser DevTools → Application → Push Messaging

5. **Test Notification Sending:**
   ```bash
   # Create a new event and check if notifications appear
   # Check browser console for errors
   ```

---

## Recommended Fixes

### Priority 1: Critical Fixes

#### Fix #1: Add NotificationProvider to Layout
```javascript
// src/app/layout.js
import { NotificationProvider } from "@/contexts/NotificationContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NotificationProvider>  {/* ADD THIS */}
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### Fix #2: Add NotificationBell to Navbar
```javascript
// src/components/Navbar.js
import NotificationBell from "./NotificationBell";

// Add to navbar (around line 158):
{pathname === "/" && (
  <>
    <NotificationBell />  {/* ADD THIS */}
    <div className="h-8 w-px bg-white/20"></div>
    <PushNotificationToggle />
  </>
)}
```

#### Fix #3: Verify Database Table
Run the migration SQL or verify table exists.

### Priority 2: Integration Fixes

#### Fix #4: Integrate Push with Pusher
Create a unified notification helper:

```javascript
// src/lib/notificationHelper.js
import { triggerNotification } from "./pusher";
import { sendPushNotificationToMultiple } from "./pushNotification";
import { supabase } from "./supabase";

export async function sendUnifiedNotification(channel, event, data) {
  // Send Pusher notification
  await triggerNotification(channel, event, data);
  
  // Send push notification
  try {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*");
    
    if (subscriptions && subscriptions.length > 0) {
      const pushSubs = subscriptions.map(sub => ({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }));
      
      await sendPushNotificationToMultiple(pushSubs, {
        title: getNotificationTitle(event),
        message: getNotificationMessage(event, data),
        data: data
      });
    }
  } catch (error) {
    console.error("Failed to send push notifications:", error);
  }
}

function getNotificationTitle(event) {
  const titles = {
    "new-event": "🎉 New Event Available!",
    "low-tickets": "⚠️ Limited Tickets!",
    "event-ongoing": "🔴 Event Now Live!",
    "event-updated": "📝 Event Updated"
  };
  return titles[event] || "EventHub Notification";
}

function getNotificationMessage(event, data) {
  switch(event) {
    case "new-event":
      return `${data.eventTitle} has been posted`;
    case "low-tickets":
      return `Only ${data.remainingTickets} tickets left for ${data.eventTitle}`;
    case "event-ongoing":
      return `${data.eventTitle} is now ongoing`;
    case "event-updated":
      return `${data.eventTitle} has been updated`;
    default:
      return "You have a new notification";
  }
}
```

Then replace all `triggerNotification` calls with `sendUnifiedNotification`.

### Priority 3: UX Improvements

#### Fix #5: Show Push Toggle on All Pages
```javascript
// src/components/Navbar.js
// Remove pathname === "/" condition
{user && (
  <>
    <NotificationBell />
    <div className="h-8 w-px bg-white/20"></div>
    <PushNotificationToggle />
  </>
)}
```

---

## Security Considerations

### ✅ Good Practices Found

1. **VAPID Keys in Environment Variables**
   - Private key never exposed to client
   - Public key properly used for subscription

2. **Graceful Degradation**
   - System works even if push_subscriptions table doesn't exist
   - Errors are logged but don't crash the app

3. **Cron Secret Protection**
   - `/api/cron/check-ongoing-events` checks authorization header

### ⚠️ Potential Issues

1. **No User-Specific Subscriptions**
   - Push notifications sent to ALL subscriptions
   - No filtering by user preferences or event interests

2. **No Subscription Cleanup**
   - Invalid subscriptions (410/404 errors) are flagged but not automatically removed
   - Could accumulate dead subscriptions over time

---

## Performance Considerations

### Current Performance

1. **Event Status Checker**
   - Runs every 5 minutes on client
   - Could be heavy if many users online
   - ✅ Good: Only checks UPCOMING events

2. **Push Notification Sending**
   - Sends to ALL subscriptions at once
   - Could be slow with many subscribers
   - ⚠️ Consider batching for large subscriber lists

### Recommendations

1. **Move Event Status Checker to Server**
   - Use Vercel Cron Jobs instead of client-side polling
   - More reliable and efficient

2. **Batch Push Notifications**
   - Send in batches of 100 subscriptions
   - Add retry logic for failed sends

3. **Add Notification Preferences**
   - Let users choose which events to be notified about
   - Reduce unnecessary notifications

---

## Conclusion

### Summary of Issues

| Issue | Severity | Impact | Fix Difficulty |
|-------|----------|--------|----------------|
| NotificationProvider not in layout | 🔴 Critical | Real-time notifications don't work | Easy |
| NotificationBell not rendered | 🟡 High | No notification history UI | Easy |
| Database table missing | 🔴 Critical | Push subscriptions can't be saved | Easy |
| No system integration | 🟡 High | Duplicate code, inconsistent UX | Medium |
| Push toggle only on home | 🟢 Low | Minor UX issue | Easy |

### Immediate Actions Required

1. ✅ **Add NotificationProvider to layout.js**
2. ✅ **Add NotificationBell to Navbar**
3. ✅ **Verify/create push_subscriptions table**
4. ⚠️ **Test the system end-to-end**
5. ⚠️ **Consider integrating both notification systems**

### Long-term Improvements

1. Create unified notification system
2. Add user notification preferences
3. Implement notification history persistence
4. Add notification analytics
5. Move cron jobs to server-side

---

## Next Steps

Would you like me to:

1. **Fix the critical issues** (add NotificationProvider, NotificationBell, verify DB)?
2. **Create the unified notification helper** to integrate both systems?
3. **Set up proper testing** for the notification system?
4. **Implement notification preferences** for users?

Let me know which fixes you'd like me to implement first!
