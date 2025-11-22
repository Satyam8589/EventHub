# Ticket Email Implementation Guide

## ✅ What's Already Done

1. **Event Report Generation** - Complete ✅
   - Super admin can generate AI-powered reports
   - Reports use ₹ (Indian Rupees)
   - No individual user information included
   - Sent to organizer's email

2. **Email Infrastructure** - Ready ✅
   - Gmail SMTP configured
   - Email library (`src/lib/email.js`) exists
   - QR code generation available
   - Helper function created (`src/lib/ticketEmail.js`)

## 🔧 What Needs to Be Added

### Ticket Email After Successful Payment

**File to Edit**: `src/app/api/payment/verify/route.js`

**Location**: After line 276 (after push notification is sent)

**Code to Add**:

```javascript
// Add this import at the top of the file (line 6)
import { sendTicketToUser } from "@/lib/ticketEmail";

// Add this code after line 276 (after sendNotificationToUser)
// 📧 SEND TICKET EMAIL WITH QR CODE
try {
  await sendTicketToUser(confirmedBooking.id, eventInfo);
} catch (emailError) {
  console.error("❌ Error sending ticket email:", emailError);
  // Don't fail the payment if email fails
}
```

### Complete Implementation Steps:

1. **Open** `src/app/api/payment/verify/route.js`

2. **Add import** at line 6 (after other imports):
   ```javascript
   import { sendTicketToUser } from "@/lib/ticketEmail";
   ```

3. **Find** the section around line 270-276 that says:
   ```javascript
   // Send success notification
   try {
     await sendNotificationToUser(confirmedBooking.userId, "payment-success", {
       eventTitle: eventInfo?.title || "the event",
       eventId: eventInfo?.id,
     });
   } catch (_) {}
   ```

4. **Add** this code RIGHT AFTER the notification block:
   ```javascript
   // 📧 SEND TICKET EMAIL WITH QR CODE
   try {
     await sendTicketToUser(confirmedBooking.id, eventInfo);
   } catch (emailError) {
     console.error("❌ Error sending ticket email:", emailError);
     // Don't fail the payment if email fails
   }
   ```

5. **Save** the file

6. **Test** by making a booking and completing payment

---

## 📧 What the Email Will Include

When a user successfully completes payment, they will receive an email with:

1. ✅ Event details (title, date, time, location)
2. ✅ Booking information (tickets, amount paid)
3. ✅ QR code (attached as PNG image)
4. ✅ Professional EventHub branding
5. ✅ Payment confirmation

---

## 🧪 Testing

After adding the code:

1. Make a test booking
2. Complete the payment successfully
3. Check the user's email
4. Verify the QR code is attached
5. Check server logs for confirmation

---

## 📝 Files Involved

- `src/app/api/payment/verify/route.js` - Payment verification (needs edit)
- `src/lib/ticketEmail.js` - Helper function (already created ✅)
- `src/lib/email.js` - Email service (already configured ✅)

---

## ⚠️ Important Notes

- The helper function (`sendTicketToUser`) is already created
- Email service is already configured with Gmail
- QR code generation is handled automatically
- Emails are sent to the user's registered email address
- If email fails, payment still succeeds (won't block the transaction)

---

**Status**: Ready to implement (just add 2 lines of code!)  
**Difficulty**: Easy (copy-paste)  
**Time**: 2 minutes

---

## 🎯 Alternative: Manual Implementation

If you prefer to implement it inline without the helper function:

```javascript
// After line 276, add:
// 📧 SEND TICKET EMAIL WITH QR CODE
try {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", confirmedBooking.userId)
    .single();

  if (user) {
    const { sendTicketEmailWithRetry, generateBookingEmailHTML } = await import("@/lib/email");
    const QRCode = await import("qrcode");

    const qrData = JSON.stringify({
      bookingId: confirmedBooking.id,
      eventId: eventInfo.id,
      userId: confirmedBooking.userId,
      tickets: confirmedBooking.tickets,
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 400, margin: 2 });
    const qrCodeBuffer = Buffer.from(qrCodeDataURL.replace(/^data:image\/png;base64,/, ""), "base64");
    const emailHTML = generateBookingEmailHTML(confirmedBooking, eventInfo, user);

    await sendTicketEmailWithRetry({
      to: user.email,
      subject: `🎉 Your Ticket for ${eventInfo.title}`,
      html: emailHTML,
      attachments: [{
        filename: `ticket-${confirmedBooking.id}.png`,
        content: qrCodeBuffer,
        contentType: "image/png",
      }],
    });

    console.log("✅ Ticket email sent to:", user.email);
  }
} catch (emailError) {
  console.error("❌ Error sending ticket email:", emailError);
}
```

---

**Created**: November 23, 2025  
**Version**: 1.0.0
