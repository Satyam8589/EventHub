# 🔔 Add Push Notification for Ticket Email Sent

## What to Add
A beautiful push notification that alerts users when their ticket has been emailed to them.

---

## Step 1: Notification Type Already Added ✅

The notification type `"ticket-sent"` has already been added to `src/lib/notificationHelper.js`:

```javascript
"ticket-sent": {
  title: "📧 Ticket Sent to Email!",
  message: `Check your Gmail! Your ticket for ${eventTitle} has been sent.`,
  icon: "/icon-192.png",
  tag: "ticket-sent",
  data: { url: `/my-events` },
  requireInteraction: true,
},
```

---

## Step 2: Add Ticket Email Sending Code

### File: `src/app/api/payment/verify/route.js`

**Find this section** (around line 270-276):

```javascript
    // Send success notification
    try {
      await sendNotificationToUser(confirmedBooking.userId, "payment-success", {
        eventTitle: eventInfo?.title || "the event",
        eventId: eventInfo?.id,
      });
    } catch (_) {}

    // Return success response
    return NextResponse.json(successResponse);
```

**Replace with:**

```javascript
    // Send success notification
    try {
      await sendNotificationToUser(confirmedBooking.userId, "payment-success", {
        eventTitle: eventInfo?.title || "the event",
        eventId: eventInfo?.id,
      });
    } catch (_) {}

    // 📧 SEND TICKET EMAIL WITH QR CODE
    try {
      const ticketResult = await sendTicketToUser(confirmedBooking.id, eventInfo);
      
      if (ticketResult.success) {
        console.log("✅ Ticket email sent for booking:", confirmedBooking.id);
        
        // 🔔 Send push notification to user about ticket email
        try {
          await sendNotificationToUser(confirmedBooking.userId, "ticket-sent", {
            eventTitle: eventInfo?.title || "the event",
            eventId: eventInfo?.id,
          });
          console.log("✅ Ticket sent notification delivered to user");
        } catch (notifError) {
          console.error("❌ Error sending ticket notification:", notifError);
          // Don't fail if notification fails
        }
      } else {
        console.error("❌ Ticket email failed:", ticketResult.error);
      }
    } catch (emailError) {
      console.error("❌ Error sending ticket email:", emailError);
      // Don't fail the payment if email fails
    }

    // Return success response
    return NextResponse.json(successResponse);
```

---

## Step 3: Add Import at Top of File

**At the top of** `src/app/api/payment/verify/route.js`, **find:**

```javascript
import { supabase } from "@/lib/supabase";
import { sendNotificationToUser } from "@/lib/notificationHelper";
```

**Add this import:**

```javascript
import { supabase } from "@/lib/supabase";
import { sendNotificationToUser } from "@/lib/notificationHelper";
import { sendTicketToUser } from "@/lib/ticketEmail";
```

---

## 🎯 What This Does

### Flow:
1. **Payment succeeds** ✅
2. **Booking confirmed** ✅
3. **"Payment Successful" notification** sent 💳
4. **Ticket email generated** with all QR codes 🎫
5. **Ticket sent to Gmail** 📧
6. **"Ticket Sent to Email!" notification** sent 🔔

### User Experience:
```
User completes payment
  ↓
Notification 1: "💳 Payment Successful!"
  ↓
(Ticket is being generated and emailed...)
  ↓
Notification 2: "📧 Ticket Sent to Email!"
                "Check your Gmail! Your ticket for [Event] has been sent."
  ↓
User clicks notification → Goes to "My Events" page
```

---

## 📱 Notification Appearance

The notification will look like:

```
┌─────────────────────────────────────┐
│ 📧 Ticket Sent to Email!            │
│                                     │
│ Check your Gmail! Your ticket for   │
│ [Event Name] has been sent.         │
│                                     │
│ [View My Events]                    │
└─────────────────────────────────────┘
```

**Features:**
- ✅ Requires interaction (stays visible until clicked)
- ✅ Clickable - takes user to "My Events" page
- ✅ Beautiful emoji icon
- ✅ Clear, actionable message

---

## 🧪 Testing

After adding the code:

1. **Complete a test payment**
2. **Watch for 2 notifications:**
   - First: "💳 Payment Successful!"
   - Second: "📧 Ticket Sent to Email!"
3. **Check Gmail** - ticket should be there
4. **Click the notification** - should go to "My Events"

---

## 📊 Server Logs

You should see:

```
✅ Ticket email sent for booking: [ID]
✅ Ticket sent notification delivered to user
```

---

## ✅ Summary

**What's Added:**
1. ✅ New notification type: `"ticket-sent"`
2. ✅ Ticket email sending after payment
3. ✅ Push notification after ticket is emailed
4. ✅ Proper error handling (doesn't fail payment if notification fails)

**User Gets:**
1. Payment success notification
2. Ticket in Gmail (with all QR codes for multi-day events)
3. Push notification to check their Gmail

**Status: Ready to implement!** Just copy-paste the code above.
