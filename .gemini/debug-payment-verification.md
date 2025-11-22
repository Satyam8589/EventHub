# 🔍 DEBUGGING: Payment Verification Not Working

## Issue
After payment success, verification is not working properly.

## Possible Causes

### 1. **Frontend Shows Success Too Early**
The frontend code (RazorpayPayment.js) shows success IMMEDIATELY (line 56-60) before verification completes. If verification fails, the user already saw "success" but then gets an error.

### 2. **Verification API Failing**
The backend verification might be failing for various reasons.

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) → Console tab

Look for these messages after payment:
```
Payment Success Response: {...}
Closing Razorpay modal immediately...
Showing success popup immediately...
Verifying payment in background...
Sending verification request with: {...}
Verify response status: 200 (or error code)
Verify response text: {...}
```

**What to check:**
- ✅ Is `Verify response status: 200`?
- ✅ Is `Verify response text` showing `success: true`?
- ❌ Any errors in console?

---

### Step 2: Check Server Logs

Look at your terminal where `npm run dev` is running.

**Expected logs for successful verification:**
```
Full request body: {
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "bookingId": "..."
}
=== BOOKING QUERY RESULT (by ID) ===
✅ Payment verified successfully
✅ Ticket email sent for booking: ...
✅ Ticket sent notification delivered to user
```

**Common error patterns:**

**Error 1: Missing booking**
```
❌ Booking not found
```
**Fix**: Check if bookingId is correct

**Error 2: Signature verification failed**
```
❌ Payment verification failed - Invalid signature
```
**Fix**: Check Razorpay secret key in `.env`

**Error 3: Booking already confirmed**
```
❌ This payment has already been verified
```
**Fix**: This is expected if you retry - booking is already done

**Error 4: Database error**
```
❌ Database function error: ...
```
**Fix**: Check Supabase connection

---

### Step 3: Check Network Tab

Browser DevTools (F12) → Network tab

1. Complete a payment
2. Look for request to `/api/payment/verify`
3. Click on it
4. Check:
   - **Status**: Should be `200 OK`
   - **Response**: Should show `{"success": true, ...}`
   - **Request Payload**: Should have all required fields

---

## 🔧 Quick Fixes

### Fix 1: Check Environment Variables

Verify `.env.local` has:
```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

**Test**: Restart dev server after changing `.env`

---

### Fix 2: Add Detailed Logging

Add this to `src/app/api/payment/verify/route.js` at line 103 (after signature verification):

```javascript
console.log("✅ Signature verified successfully");
console.log("📋 Booking ID:", bookingId);
console.log("📋 Payment ID:", razorpay_payment_id);
```

This will help see where the process is failing.

---

### Fix 3: Check Database

Run this query in Supabase SQL Editor:

```sql
-- Check if booking exists
SELECT id, status, "paymentId", "userId", "eventId"
FROM bookings
WHERE id = 'YOUR_BOOKING_ID'
LIMIT 1;
```

**Expected**:
- Status should be `PENDING` before payment
- Status should be `CONFIRMED` after payment

---

### Fix 4: Test with Razorpay Test Mode

Use Razorpay test credentials:
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: `123456` (for test mode)

---

## 📊 Common Error Scenarios

### Scenario 1: "Booking not found"

**Cause**: BookingId doesn't exist in database

**Check**:
```sql
SELECT * FROM bookings WHERE id = 'YOUR_BOOKING_ID';
```

**Fix**: Ensure booking is created before payment

---

### Scenario 2: "Invalid signature"

**Cause**: Razorpay secret key mismatch

**Check**:
1. `.env.local` has correct `RAZORPAY_KEY_SECRET`
2. Restart dev server after changing `.env`
3. Secret matches your Razorpay dashboard

**Fix**:
```bash
# Restart server
Ctrl+C
npm run dev
```

---

### Scenario 3: "Already confirmed"

**Cause**: Trying to verify same payment twice

**Check**: This is actually OK - payment already succeeded

**Fix**: Check "My Events" - booking should be there

---

### Scenario 4: Timeout/No response

**Cause**: Server taking too long (should be fixed with async ticket sending)

**Check**: Server logs for errors

**Fix**: Already implemented - ticket sends in background

---

## 🧪 Test Procedure

### Complete Test Flow:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Restart dev server**:
   ```bash
   Ctrl+C
   npm run dev
   ```
3. **Open browser DevTools** (F12)
4. **Go to Console tab**
5. **Complete a test payment**
6. **Watch console logs**
7. **Check server terminal logs**
8. **Check Network tab** for `/api/payment/verify` request

---

## 📝 What to Send Me

If still not working, send me:

1. **Browser console logs** (screenshot or copy-paste)
2. **Server terminal logs** (copy-paste)
3. **Network tab** response for `/api/payment/verify`
4. **Any error messages** you see

---

## 🎯 Expected Behavior

### Successful Flow:

**Browser Console:**
```
Payment Success Response: {...}
Showing success popup immediately...
Verifying payment in background...
Verify response status: 200
Verify response text: {"success":true,...}
Payment verified successfully in background!
```

**Server Logs:**
```
Full request body: {...}
=== BOOKING QUERY RESULT (by ID) ===
✅ Signature verified successfully
✅ Payment verified successfully
(response returned to user)
🎫 Generating full ticket image for email...
✅ Ticket email sent for booking: ...
✅ Ticket sent notification delivered to user
```

**User Sees:**
1. Payment successful popup
2. Notification: "💳 Payment Successful!"
3. (5-10 seconds later) Notification: "📧 Ticket Sent to Email!"
4. Can navigate to "My Events" and see booking

---

## 🚨 Emergency Fix

If nothing works, try this minimal test:

1. **Comment out ticket sending** temporarily:
   
   In `src/app/api/payment/verify/route.js`, comment out lines 279-299:
   ```javascript
   // 📧 SEND TICKET EMAIL WITH QR CODE (in background - don't wait)
   // sendTicketToUser(confirmedBooking.id, eventInfo)
   //   .then(...)
   //   .catch(...);
   ```

2. **Test payment again**
3. **If this works**, the issue is in ticket generation
4. **If this still fails**, the issue is in payment verification itself

---

**Let me know what you see in the logs and I'll help you fix it!**
