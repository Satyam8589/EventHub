# ⏰ Add 15-Second Delay Before Sending Ticket Email

## File: `src/app/api/payment/verify/route.js`

### Find this code (around line 293-318):

```javascript
    // 📧 SEND TICKET EMAIL WITH QR CODE (in background - don't wait)
    // This prevents timeout issues since ticket generation can take several seconds
    // Using Promise.race to ensure we don't wait too long even in edge cases
    const ticketPromise = sendTicketToUser(confirmedBooking.id, eventInfo)
      .then((ticketResult) => {
        if (ticketResult.success) {
          console.log("✅ Ticket email sent for booking:", confirmedBooking.id);
          
          // 🔔 Send push notification to user about ticket email
          return sendNotificationToUser(confirmedBooking.userId, "ticket-sent", {
            eventTitle: eventInfo?.title || "the event",
            eventId: eventInfo?.id,
          })
            .then(() => console.log("✅ Ticket sent notification delivered to user"))
            .catch((notifError) => console.error("❌ Error sending ticket notification:", notifError));
        } else {
          console.error("❌ Ticket email failed:", ticketResult.error);
        }
      })
      .catch((emailError) => {
        console.error("❌ Error sending ticket email:", emailError);
      });

    // Don't await - let it run in background
    // The serverless function will keep running even after response is sent
    ticketPromise.catch(() => {}); // Prevent unhandled rejection
```

### Replace with:

```javascript
    // 📧 SEND TICKET EMAIL WITH QR CODE (in background with 15-second delay)
    // Wait 15 seconds before sending ticket email to give user time to see payment success
    const ticketPromise = new Promise((resolve) => setTimeout(resolve, 15000))
      .then(() => {
        console.log("⏰ 15 seconds elapsed, sending ticket email now...");
        return sendTicketToUser(confirmedBooking.id, eventInfo);
      })
      .then((ticketResult) => {
        if (ticketResult.success) {
          console.log("✅ Ticket email sent for booking:", confirmedBooking.id);
          
          // 🔔 Send push notification to user about ticket email
          return sendNotificationToUser(confirmedBooking.userId, "ticket-sent", {
            eventTitle: eventInfo?.title || "the event",
            eventId: eventInfo?.id,
          })
            .then(() => console.log("✅ Ticket sent notification delivered to user"))
            .catch((notifError) => console.error("❌ Error sending ticket notification:", notifError));
        } else {
          console.error("❌ Ticket email failed:", ticketResult.error);
        }
      })
      .catch((emailError) => {
        console.error("❌ Error sending ticket email:", emailError);
      });

    // Don't await - let it run in background
    // The serverless function will keep running even after response is sent
    ticketPromise.catch(() => {}); // Prevent unhandled rejection
```

### Key Change:
Just add this line before sending the ticket:
```javascript
const ticketPromise = new Promise((resolve) => setTimeout(resolve, 15000))
  .then(() => {
    console.log("⏰ 15 seconds elapsed, sending ticket email now...");
    return sendTicketToUser(confirmedBooking.id, eventInfo);
  })
```

### Timeline:
```
0s:  Payment verified
1s:  User sees "Payment Successful!" page
1s:  Notification 1: "💳 Payment Successful!"
15s: (15 seconds later)
15s: Ticket email sent
16s: Notification 2: "📧 Ticket Sent to Email!"
```

### Benefits:
- ✅ User has time to see payment success
- ✅ Clearer notification sequence
- ✅ Better user experience
- ✅ Still works in background

That's it! Just add the setTimeout wrapper.
