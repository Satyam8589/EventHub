# Quick Testing Guide - Payment Flow

## 🚀 Test the Fixed Payment Flow

### Prerequisites
- Deploy the updated code to production
- Have a test event created
- Have Razorpay test mode enabled (or use small amounts in live mode)

## Test Case 1: Successful Payment ✅

**Steps:**
1. Go to Events page
2. Click on any event
3. Click "Book Tickets"
4. Fill in the form:
   - Full Name: Test User
   - Email: your-email@example.com
   - Phone: 9876543210
   - Number of Tickets: 1
5. Click "Proceed to Payment"
6. Complete payment on Razorpay modal
7. **EXPECTED RESULT:**
   - ✅ See "🎉 Booking Complete!" message
   - ✅ See "Your payment has been verified..."
   - ✅ See "Redirecting to My Events page..."
   - ✅ After 3 seconds, automatically go to `/my-events`
   - ✅ See your booking with status: CONFIRMED
   - ✅ Receive ticket email within 1-2 minutes

## Test Case 2: User Cancels Payment ⚠️

**Steps:**
1. Go through booking form
2. Click "Proceed to Payment"
3. **Close the Razorpay modal** without paying
4. **EXPECTED RESULT:**
   - Modal closes
   - Returns to booking form
   - No error message shown
   - Can fill form and try again

## Test Case 3: Payment Declined ❌

**Steps:**
1. Go through booking form
2. Click "Proceed to Payment"
3. Use a test card that will decline (if in test mode)
4. **EXPECTED RESULT:**
   - See "❌ Booking Not Completed" message
   - See error message explaining what went wrong
   - See "Try Again" and "Close" buttons
   - Clicking "Try Again" returns to booking form

## Test Case 4: Network Error During Verification ❌

**Steps:**
1. Go through booking form
2. Click "Proceed to Payment"
3. Turn off internet after payment but before verification
4. **EXPECTED RESULT:**
   - See "❌ Booking Not Completed" message
   - See "Payment verification failed. Please contact support."
   - User can contact support with booking details

## 🔍 Where to Check

### 1. Browser Console
Open DevTools (F12) and look for:
```
=== PAYMENT VERIFICATION REQUEST ===
Order ID: order_xxxxx
Payment ID: pay_xxxxx
Booking ID: booking_xxxxx
✅ SIGNATURE VERIFIED - PAYMENT IS AUTHENTIC
✅ BOOKING CONFIRMED SUCCESSFULLY
✅ TICKET EMAIL SENT SUCCESSFULLY
```

### 2. Database (Supabase)
Check bookings table:
```sql
SELECT 
  id, 
  status, 
  paymentId, 
  tickets, 
  totalAmount,
  createdAt,
  updatedAt
FROM bookings
ORDER BY createdAt DESC
LIMIT 5;
```

**Successful booking should show:**
- status: `CONFIRMED`
- paymentId: `pay_xxxxxxxxxx` (actual Razorpay payment ID)
- updatedAt: Recent timestamp

**Failed booking should show:**
- status: `FAILED`
- paymentId: `PENDING_order_xxxxx` (still pending)
- failureReason: Error message

### 3. Email Inbox
Check for email with:
- Subject: "🎉 Payment Successful! Your Ticket for [Event Name]"
- Ticket image attached as PNG
- Booking details in email body

### 4. Razorpay Dashboard
Go to dashboard.razorpay.com:
- Check "Payments" section
- Verify payment shows as "captured"
- Order ID should match booking

### 5. My Events Page
Navigate to `/my-events`:
- Should see all confirmed bookings
- Each booking shows:
  - Event name
  - Number of tickets
  - Booking status
  - Ticket download option

## 🐛 Common Issues & Solutions

### Issue: Still shows "Booking Not Completed" after successful payment
**Solution:**
1. Check browser console for errors
2. Verify crypto import exists in create-order route
3. Check Razorpay keys in environment variables
4. Look for signature verification logs

### Issue: Redirect doesn't work
**Solution:**
1. Verify `useRouter` import in BookingModal
2. Check if `/my-events` page exists
3. Look for navigation errors in console

### Issue: Ticket email not received
**Solution:**
1. Check spam folder
2. Verify Gmail SMTP settings
3. Check email address in user profile
4. Look for email sending errors in server logs

### Issue: Payment succeeds but booking stays PENDING
**Solution:**
1. Check verification API logs
2. Verify booking lookup query
3. Check if paymentId format is correct
4. Look for database update errors

## 📊 Success Indicators

After testing, you should have:
- ✅ At least one CONFIRMED booking in database
- ✅ Ticket email received
- ✅ Successful redirect to My Events page
- ✅ No errors in browser console
- ✅ Payment shows as "captured" in Razorpay

## 🚨 Red Flags

Watch out for:
- ❌ Payment succeeds but shows failure message
- ❌ Redirect doesn't happen
- ❌ Ticket email not sent
- ❌ Booking status stays PENDING
- ❌ Multiple bookings created for one payment
- ❌ Console shows signature verification errors

## 📝 Test Results Template

Use this to document your testing:

```
Date: ___________
Environment: Production / Staging

Test Case 1 - Successful Payment:
[ ] Booking form submitted successfully
[ ] Razorpay modal opened
[ ] Payment completed
[ ] Success message shown
[ ] Redirected to My Events after 3 seconds
[ ] Booking shows CONFIRMED in database
[ ] Ticket email received
Notes: ___________

Test Case 2 - User Cancels:
[ ] Modal closes cleanly
[ ] No error shown
[ ] Can retry booking
Notes: ___________

Test Case 3 - Payment Declined:
[ ] Failure message shown
[ ] Error message is clear
[ ] Try Again button works
Notes: ___________

Overall Result: PASS / FAIL
Issues Found: ___________
```

## 🎯 Next Steps After Testing

If all tests pass:
- ✅ Document the fix in your changelog
- ✅ Notify users about improved booking experience
- ✅ Monitor first few real bookings closely
- ✅ Consider adding analytics to track success rate

If tests fail:
- ❌ Check PAYMENT_FLOW_FIX.md for debugging steps
- ❌ Review server logs for errors
- ❌ Verify all environment variables
- ❌ Double-check all code changes were deployed

---

**Last Updated:** After payment flow fix with redirect to My Events
**Critical Files:** BookingModal.js, RazorpayPayment.js, create-order route, verify route
