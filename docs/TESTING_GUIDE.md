# 🧪 Ticket Email System - Testing Guide

## ✅ Pre-Test Checklist

Before testing, verify:
- [x] Dev server is running on port 3000 ✅
- [ ] You have a test user account
- [ ] You have an event with available tickets
- [ ] Gmail credentials are configured in `.env.local`
- [ ] You have Razorpay test credentials

---

## 🎯 Test Plan

### Test 1: Complete Booking Flow
**Objective**: Verify ticket email is sent after successful payment

**Steps**:
1. Open browser: `http://localhost:3000`
2. Login with your test account
3. Find an event and click "Book Now"
4. Enter booking details (number of tickets)
5. Proceed to payment
6. Use Razorpay test card:
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
7. Complete payment
8. Wait for confirmation

**Expected Results**:
- ✅ Payment succeeds
- ✅ Booking is confirmed
- ✅ Success message appears
- ✅ Email is sent to user's email
- ✅ Server logs show: `✅ Ticket email sent for booking: [id]`

---

### Test 2: Check Email Content
**Objective**: Verify email has all required elements

**Steps**:
1. Check the user's email inbox
2. Look for email with subject: `🎉 Your Ticket for [Event Name]`
3. Open the email

**Expected Email Contents**:
- ✅ Professional EventHub header
- ✅ Greeting with user's name
- ✅ Event title
- ✅ Event date and time
- ✅ Event location
- ✅ Booking ID
- ✅ Number of tickets
- ✅ Amount paid (in ₹)
- ✅ QR code attachment (PNG file)
- ✅ EventHub footer

---

### Test 3: QR Code Verification
**Objective**: Verify QR code is valid

**Steps**:
1. Download the QR code attachment from email
2. Open the PNG file
3. Scan it with a QR code reader app

**Expected QR Code Data**:
```json
{
  "bookingId": "booking-id-here",
  "eventId": "event-id-here",
  "userId": "user-id-here",
  "tickets": 2
}
```

---

### Test 4: Server Logs Verification
**Objective**: Verify all processes execute correctly

**Steps**:
1. Open your terminal where dev server is running
2. Make a booking
3. Watch the logs

**Expected Log Messages**:
```
📊 Generating report for event: [if testing reports]
📧 Preparing to send ticket email for booking: [booking-id]
✅ Ticket email sent successfully to: [user-email]
✅ Ticket email sent for booking: [booking-id]
```

---

## 🔍 Detailed Testing Steps

### Step 1: Prepare Test Environment

1. **Check Gmail Configuration**:
   ```bash
   # Open .env.local and verify:
   GMAIL_USER=join.eventhub@gmail.com
   GMAIL_APP_PASSWORD=hztg vxqy bljz bnse
   ```

2. **Verify Dev Server**:
   - Server should be running on `http://localhost:3000`
   - No errors in terminal

3. **Prepare Test User**:
   - Email: Use a real email you can access
   - Password: Your test password

---

### Step 2: Make Test Booking

1. **Navigate to Events**:
   ```
   http://localhost:3000/events
   ```

2. **Select an Event**:
   - Click on any upcoming event
   - Click "Book Now"

3. **Fill Booking Form**:
   - Number of tickets: 2 (or any number)
   - Click "Proceed to Payment"

4. **Complete Payment**:
   - Use Razorpay test credentials
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
   - Click "Pay"

---

### Step 3: Verify Email Delivery

1. **Check Email Inbox**:
   - Wait 10-30 seconds
   - Refresh inbox
   - Look for EventHub email

2. **If Email Not Received**:
   - Check spam/junk folder
   - Check server logs for errors
   - Verify Gmail credentials
   - Check user's email in database

---

### Step 4: Test Event Report (Bonus)

1. **Login as Super Admin**
2. **Navigate to**:
   ```
   http://localhost:3000/admin/events
   ```
3. **Click "📊 Report"** on any event
4. **Confirm** the dialog
5. **Wait** for success message
6. **Check** organizer's email for report

---

## 🐛 Troubleshooting

### Issue 1: Email Not Sent
**Symptoms**: No email received, error in logs

**Check**:
1. Gmail credentials in `.env.local`
2. User's email in database
3. Internet connection
4. Server logs for specific error

**Solution**:
```javascript
// Check logs for:
❌ Error sending ticket email: [error message]
```

---

### Issue 2: QR Code Missing
**Symptoms**: Email received but no attachment

**Check**:
1. Email client supports attachments
2. Check spam folder
3. Server logs for QR generation errors

---

### Issue 3: Payment Succeeds but No Email
**Symptoms**: Booking confirmed, no email

**Check**:
1. Server logs show email attempt
2. Email function was called
3. No errors in try-catch block

**Debug**:
```javascript
// Add console.log in payment/verify/route.js
console.log("About to send ticket email...");
await sendTicketToUser(confirmedBooking.id, eventInfo);
console.log("Ticket email function completed");
```

---

## 📊 Test Results Template

```
Test Date: _______________
Tester: _______________

Test 1: Complete Booking Flow
- Payment Success: ✅ / ❌
- Email Sent: ✅ / ❌
- Time Taken: _____ seconds

Test 2: Email Content
- Subject Correct: ✅ / ❌
- Event Details: ✅ / ❌
- QR Code Attached: ✅ / ❌
- Formatting: ✅ / ❌

Test 3: QR Code
- File Downloaded: ✅ / ❌
- Scannable: ✅ / ❌
- Data Correct: ✅ / ❌

Test 4: Server Logs
- Logs Visible: ✅ / ❌
- No Errors: ✅ / ❌

Overall Status: ✅ PASS / ❌ FAIL

Notes:
_________________________________
_________________________________
```

---

## 🎯 Quick Test Command

For a quick smoke test:

1. **Open Browser**: `http://localhost:3000`
2. **Login** with test account
3. **Book** any event
4. **Pay** with test card: `4111 1111 1111 1111`
5. **Check** email within 30 seconds

**Expected**: Email with QR code in inbox ✅

---

## 📞 Need Help?

If tests fail:
1. Check `docs/TROUBLESHOOTING.md`
2. Review server logs carefully
3. Verify all environment variables
4. Test email service separately

---

**Testing Version**: 1.0.0  
**Last Updated**: November 23, 2025
