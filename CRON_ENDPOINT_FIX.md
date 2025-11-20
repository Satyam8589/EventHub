# Cron Endpoint Fix - check-ongoing-events

## Problem
The `/api/cron/check-ongoing-events` endpoint was returning:
```
GET /api/cron/check-ongoing-events 401 in 55ms
{error: "Unauthorized"}
```

## Root Cause
The endpoint had authentication protection that required a `CRON_SECRET` header, but:
1. In development, we don't usually pass auth headers
2. The endpoint was still using old Pusher notifications instead of push notifications

## Fixes Applied

### 1. Made Auth Optional in Development ✅
**File:** `src/app/api/cron/check-ongoing-events/route.js`

**Before:**
```javascript
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**After:**
```javascript
const isDevelopment = process.env.NODE_ENV === 'development';

if (cronSecret && !isDevelopment && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Result:** In development mode, the endpoint works without authentication. In production, it still requires the `CRON_SECRET`.

---

### 2. Updated to Use Push Notifications ✅

**Before (Pusher):**
```javascript
import { triggerNotification, NOTIFICATION_EVENTS } from "@/lib/pusher";

await triggerNotification("events", NOTIFICATION_EVENTS.EVENT_ONGOING, {
  eventId: updatedEvent.id,
  eventTitle: updatedEvent.title,
  eventDate: updatedEvent.date,
  eventLocation: updatedEvent.location,
  eventVenue: updatedEvent.venue,
});
```

**After (Push Notifications):**
```javascript
import { sendNotificationToAll } from "@/lib/notificationHelper";

await sendNotificationToAll('event-ongoing', {
  eventId: updatedEvent.id,
  eventTitle: updatedEvent.title,
});
```

**Result:** Now sends "🔴 Event Now Live!" push notifications to all subscribed users when an event becomes ONGOING.

---

## How It Works

### What the Cron Does:
1. Runs periodically (checks every X minutes)
2. Fetches all events with status "UPCOMING"
3. Checks if current time is between event start and end dates
4. If yes, updates status to "ONGOING"
5. Sends push notification to all users: "🔴 Event Now Live!"

### Notification Content:
- **Title:** "🔴 Event Now Live!"
- **Message:** "{Event Title} is now ongoing. Don't miss out!"
- **Action:** Clicking opens the event details page

---

## Testing

### Test the Endpoint:

**Method 1: Browser**
```
http://localhost:3000/api/cron/check-ongoing-events
```

**Method 2: cURL**
```bash
curl http://localhost:3000/api/cron/check-ongoing-events
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Checked X events, updated Y to ONGOING",
  "updatedEvents": [
    {
      "id": "event-id",
      "title": "Event Title",
      "status": "ONGOING"
    }
  ]
}
```

---

### Test with an Actual Event:

1. **Create a test event** with:
   - Status: UPCOMING
   - Start date/time: Current time (or 1 minute from now)
   - End date/time: 1 hour from now

2. **Wait for the event time** (or manually trigger the cron)

3. **Call the cron endpoint:**
   ```
   GET http://localhost:3000/api/cron/check-ongoing-events
   ```

4. **Verify:**
   - Event status changed to "ONGOING" in database
   - Push notification sent to all subscribed users
   - Console shows: "Event {title} is now ONGOING - push notification sent"

---

## Production Setup

### For Production (Vercel, etc.):

1. **Set CRON_SECRET** in environment variables:
   ```
   CRON_SECRET=your-secure-random-secret
   ```

2. **Configure Vercel Cron:**
   Create `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/check-ongoing-events",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```
   This runs every 5 minutes.

3. **Add Authorization Header:**
   Vercel automatically adds the auth header when calling cron jobs.

---

## Database Query to Check

### Find events that should be ONGOING:
```sql
SELECT 
  id,
  title,
  status,
  date as start_date,
  enddate as end_date,
  NOW() as current_time
FROM events
WHERE status = 'UPCOMING'
  AND date <= NOW()
  AND (enddate IS NULL OR enddate >= NOW());
```

### Manually update an event to test:
```sql
UPDATE events
SET status = 'ONGOING'
WHERE id = 'your-event-id';
```

---

## Environment Variables

Make sure these are set in `.env.local`:

```env
# Optional - only enforced in production
CRON_SECRET=eventhub_cron_secret_2025

# Required for push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_EMAIL=mailto:your-email@example.com
```

---

## Troubleshooting

### Issue: Still getting 401 Unauthorized
**Solutions:**
1. Check `NODE_ENV` is set to 'development'
2. Restart the dev server: `npm run dev`
3. Clear Next.js cache: Delete `.next` folder and restart

### Issue: No notifications sent
**Solutions:**
1. Check users are subscribed to push notifications
2. Verify VAPID keys are correct
3. Check console for errors
4. Test push notifications separately first

### Issue: Events not updating to ONGOING
**Solutions:**
1. Check event dates are correct (not in future)
2. Verify event status is "UPCOMING"
3. Check database connection
4. Look at console logs for errors

---

## Summary

✅ **Fixed 401 Unauthorized** - Auth is now optional in development  
✅ **Updated to Push Notifications** - Removed Pusher dependency  
✅ **Added Logging** - Better debugging with console logs  
✅ **Maintained Security** - Still requires auth in production  

The cron endpoint now works seamlessly in development and will send push notifications when events go live! 🎉
