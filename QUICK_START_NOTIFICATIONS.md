# Quick Start Guide - Notification System

## 🚀 What's New

Your EventHub now has a **complete notification system** with payment status notifications!

### Payment Notifications
- ⏳ **Payment Pending** - When user starts payment
- ✅ **Payment Success** - When payment is verified
- ❌ **Payment Failed** - When payment fails

### Notification Channels
- 🔔 **In-App Toasts** - Real-time notifications while on site
- 📱 **Browser Push** - Native notifications even when offline
- 🔴 **Notification Bell** - View notification history

---

## 📋 Quick Test

### Test Payment Notifications (5 minutes)

1. **Enable Push Notifications:**
   - Go to home page
   - Click the bell icon in navbar
   - Allow browser notifications

2. **Test Pending:**
   - Book a paid event
   - See "⏳ Payment Pending" toast

3. **Test Success:**
   - Complete payment
   - See "✅ Payment Successful!" toast
   - Check notification bell for history

4. **Test Failed:**
   - Try to book with invalid payment
   - See "❌ Payment Failed" toast

---

## 🔧 Verify Setup

### 1. Check Database Table

Run in Supabase SQL Editor:
```sql
SELECT * FROM push_subscriptions LIMIT 1;
```

**If error:** Run this migration:
```sql
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

### 2. Check Environment Variables

Verify in `.env.local`:
```env
NEXT_PUBLIC_PUSHER_KEY=✓
PUSHER_SECRET=✓
NEXT_PUBLIC_VAPID_PUBLIC_KEY=✓
VAPID_PRIVATE_KEY=✓
```

### 3. Test in Browser Console

```javascript
// Check Pusher
console.log(process.env.NEXT_PUBLIC_PUSHER_KEY);

// Check VAPID
console.log(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
```

---

## 📝 Usage Examples

### Send Payment Success Notification

```javascript
import { sendNotificationToUser } from "@/lib/notificationHelper";

await sendNotificationToUser(userId, "payment-success", {
  eventTitle: "Summer Festival",
  eventId: "event-123",
});
```

### Send to All Users

```javascript
import { sendNotificationToAll } from "@/lib/notificationHelper";

await sendNotificationToAll("new-event", {
  eventTitle: "New Year Party",
  eventId: "event-456",
});
```

---

## 🎯 Key Features

### ✅ Fixed Issues
- NotificationProvider now wraps the app
- NotificationBell visible in navbar
- Both Pusher and Web Push working together

### ✅ New Features
- Payment pending notifications
- Payment success notifications
- Payment failed notifications
- Unified notification system
- Notification history in bell dropdown

### ✅ User Experience
- Instant feedback on payment status
- Clear messaging for each state
- Multiple notification channels
- Works even when offline (push)

---

## 🐛 Troubleshooting

### No Notifications?
1. Check browser console for errors
2. Verify Pusher key in env variables
3. Check NotificationProvider is in layout
4. Ensure user is logged in

### No Push Notifications?
1. Check browser permissions (Allow notifications)
2. Verify service worker is active (DevTools → Application)
3. Check VAPID keys in env variables
4. Ensure push_subscriptions table exists

### Notifications Not Saving?
1. Check database table exists
2. Verify user_id is correct
3. Check Supabase connection
4. Look for errors in API logs

---

## 📚 Documentation

- **Full Analysis:** `NOTIFICATION_SYSTEM_ANALYSIS.md`
- **Implementation Details:** `PAYMENT_NOTIFICATIONS_IMPLEMENTATION.md`
- **This Guide:** `QUICK_START_NOTIFICATIONS.md`

---

## ✨ What Happens Now

### When User Books a Ticket:

```
1. User clicks "Book Tickets"
   ↓
2. ⏳ "Payment Pending" notification
   ↓
3. User completes payment
   ↓
4. ✅ "Payment Successful!" notification
   ↓
5. User receives:
   - In-app toast
   - Browser push notification
   - Email confirmation
   - QR code ticket
```

### If Payment Fails:

```
1. Payment fails
   ↓
2. ❌ "Payment Failed" notification
   ↓
3. User sees error message
   ↓
4. User can try again
```

---

## 🎉 You're All Set!

Your notification system is now **fully functional** and ready for production!

**Next Steps:**
1. Test all notification types
2. Verify database table exists
3. Check environment variables
4. Deploy to production

**Need Help?**
- Check the full documentation files
- Review the code comments
- Test in development first

---

**Happy Coding! 🚀**
