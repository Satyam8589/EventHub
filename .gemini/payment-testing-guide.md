# Payment Stability Testing Guide

## Overview
This guide provides comprehensive test scenarios to verify the improved payment-to-verification system is working correctly.

## Test Environment Setup

### Prerequisites
- [ ] Development server running
- [ ] Razorpay test mode credentials configured
- [ ] Database migrations applied
- [ ] Webhook configured (optional for some tests)

### Test Data Needed
- Test event with available capacity
- Test user account
- Razorpay test card: `4111 1111 1111 1111`
- Test CVV: Any 3 digits
- Test expiry: Any future date

## Test Scenarios

### 1. Happy Path - Successful Payment

**Objective**: Verify normal payment flow works correctly

**Steps**:
1. Navigate to event page
2. Click "Book Tickets"
3. Fill in booking details
4. Click "Proceed to Payment"
5. Complete payment with test card
6. Wait for verification

**Expected Results**:
- ✅ Payment modal closes immediately after payment
- ✅ Success message shows "Payment successful! Verifying..."
- ✅ Verification completes within 2-3 seconds
- ✅ User redirected to "My Events" page
- ✅ Ticket appears in "My Events"
- ✅ Email received with ticket QR code
- ✅ Push notification received (if enabled)

**Database Checks**:
```sql
-- Check booking status
SELECT id, status, "paymentId", tickets, "totalAmount"
FROM bookings
WHERE id = 'booking_id_here';

-- Should show: status = 'CONFIRMED', paymentId starts with 'pay_'

-- Check verification log
SELECT * FROM payment_verification_log
WHERE booking_id = 'booking_id_here'
ORDER BY created_at DESC;

-- Should show: success = true, verification_source = 'client'
```

---

### 2. Network Interruption During Verification

**Objective**: Test retry mechanism handles network issues

**Steps**:
1. Open browser DevTools → Network tab
2. Start booking process
3. Complete payment
4. **Immediately** set Network to "Offline" in DevTools
5. Wait 2 seconds
6. Set Network back to "Online"

**Expected Results**:
- ✅ First verification attempt fails (network offline)
- ✅ System automatically retries (attempt 2)
- ✅ Second attempt succeeds (network online)
- ✅ User sees success message
- ✅ Booking confirmed in database

**Console Logs to Check**:
```
🔄 Verification attempt 1/3
❌ Verification attempt 1 error: Failed to fetch
⏳ Waiting 1000ms before retry...
🔄 Verification attempt 2/3
✅ Payment verified successfully!
```

---

### 3. Browser Closed After Payment

**Objective**: Verify webhook ensures ticket delivery

**Steps**:
1. Start booking process
2. Complete payment on Razorpay
3. **Immediately close browser tab** (before verification completes)
4. Wait 30 seconds
5. Open "My Events" page in new tab

**Expected Results**:
- ✅ Ticket appears in "My Events" (confirmed via webhook)
- ✅ Email received with ticket
- ✅ Booking status is CONFIRMED

**Webhook Logs to Check**:
```
🔔 Webhook received at: [timestamp]
✅ Webhook signature verified
💰 Processing payment.captured
✅ Booking confirmed via webhook
📧 Ticket email sent via webhook
```

**Note**: This test requires webhook to be configured

---

### 4. Duplicate Verification Requests

**Objective**: Test idempotency prevents duplicate tickets

**Steps**:
1. Complete payment successfully
2. Note the booking ID
3. Manually call verification API again with same payment details:
```javascript
fetch('/api/payment/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    razorpay_order_id: 'order_xxx',
    razorpay_payment_id: 'pay_xxx',
    razorpay_signature: 'signature_xxx',
    bookingId: 'booking_id_xxx'
  })
});
```

**Expected Results**:
- ✅ Second request returns success (not error)
- ✅ Response includes `alreadyProcessed: true`
- ✅ No duplicate ticket generated
- ✅ No duplicate email sent
- ✅ Booking count remains 1

---

### 5. Verification Timeout with Status Polling

**Objective**: Test status polling fallback mechanism

**Steps**:
1. Modify code temporarily to simulate slow verification:
```javascript
// In verify/route.js, add at start of POST function:
await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
```
2. Complete payment
3. Watch console logs

**Expected Results**:
- ✅ Initial verification attempts timeout
- ✅ Status polling starts automatically
- ✅ Polling detects CONFIRMED status
- ✅ User sees success message
- ✅ Redirect to My Events works

**Console Logs**:
```
🔄 Verification attempt 1/3
❌ Verification attempt 1 error: timeout
🔄 Verification attempt 2/3
❌ Verification attempt 2 error: timeout
🔄 Verification attempt 3/3
❌ Verification attempt 3 error: timeout
🔍 Starting status polling fallback...
📊 Polling attempt 1/15
📋 Booking status: CONFIRMED
✅ Payment confirmed via status polling!
```

**Cleanup**: Remove the delay code after testing

---

### 6. Payment Failure Handling

**Objective**: Verify failed payments are handled correctly

**Steps**:
1. Start booking process
2. Click "Proceed to Payment"
3. Click "X" to close Razorpay modal (cancel payment)

**Expected Results**:
- ✅ Payment modal closes
- ✅ Booking modal remains open
- ✅ No error message shown (user cancelled)
- ✅ Booking status remains PENDING in database
- ✅ Capacity not reduced

**Alternative Test - Card Declined**:
1. Use Razorpay test card for failure: `4000 0000 0000 0002`
2. Complete payment

**Expected Results**:
- ✅ Error message shown
- ✅ Booking marked as FAILED
- ✅ Failure notification sent
- ✅ User can retry

---

### 7. Concurrent Booking Attempts (Race Condition)

**Objective**: Test atomic booking prevents overselling

**Steps**:
1. Create event with capacity = 1
2. Open two browser windows side by side
3. Start booking in both windows simultaneously
4. Complete payment in both windows at same time

**Expected Results**:
- ✅ First payment succeeds
- ✅ Second payment fails with "Not enough tickets available"
- ✅ Only 1 booking confirmed
- ✅ Second user gets refund (Razorpay automatic)
- ✅ Event shows as sold out

**Database Check**:
```sql
SELECT COUNT(*) as confirmed_bookings
FROM bookings
WHERE "eventId" = 'event_id_here'
AND status = 'CONFIRMED';

-- Should show: 1
```

---

### 8. Webhook Signature Validation

**Objective**: Verify webhook security

**Steps**:
1. Send webhook request with invalid signature:
```bash
curl -X POST https://your-domain.com/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: invalid_signature" \
  -d '{"event":"payment.captured","payload":{}}'
```

**Expected Results**:
- ✅ Request rejected with 401 status
- ✅ Error logged: "Invalid webhook signature"
- ✅ No booking processed

---

### 9. Email Delivery Verification

**Objective**: Ensure ticket emails are sent

**Steps**:
1. Complete successful payment
2. Check email inbox (including spam folder)
3. Verify email content

**Expected Results**:
- ✅ Email received within 30 seconds
- ✅ Email contains QR code
- ✅ Email has correct event details
- ✅ Email has booking ID
- ✅ QR code is scannable

**Database Check**:
```sql
SELECT "ticketgeneratedat", "paymentVerifiedAt"
FROM bookings
WHERE id = 'booking_id_here';

-- Both should have timestamps
```

---

### 10. Discount Code with Payment

**Objective**: Verify discount codes work with new payment flow

**Steps**:
1. Create discount code in admin panel
2. Start booking process
3. Apply discount code
4. Complete payment with discounted amount
5. Verify booking

**Expected Results**:
- ✅ Discount applied correctly
- ✅ Payment amount matches discounted price
- ✅ Booking shows original and discounted amounts
- ✅ Discount usage incremented
- ✅ Ticket generated successfully

**Database Check**:
```sql
SELECT 
  "totalAmount",
  "originalAmount", 
  "discountAmount",
  "discountId"
FROM bookings
WHERE id = 'booking_id_here';

-- Should show correct discount calculation
```

---

## Performance Testing

### Response Time Benchmarks

**Verification Endpoint**:
- Target: < 2 seconds
- Maximum acceptable: 5 seconds

**Webhook Processing**:
- Target: < 3 seconds
- Maximum acceptable: 10 seconds

**Status Polling**:
- Interval: 2 seconds
- Maximum attempts: 15 (30 seconds total)

### Load Testing

Test with multiple concurrent payments:
```bash
# Using Apache Bench
ab -n 100 -c 10 -p payment.json -T application/json \
  https://your-domain.com/api/payment/create-order
```

**Expected Results**:
- ✅ All requests complete successfully
- ✅ No overselling occurs
- ✅ Response times remain acceptable
- ✅ No database deadlocks

---

## Monitoring Queries

### Verification Success Rate (Last 24 Hours)
```sql
SELECT 
  verification_source,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate,
  AVG(response_time_ms) as avg_response_time
FROM payment_verification_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY verification_source;
```

### Recent Failed Verifications
```sql
SELECT 
  pvl.booking_id,
  pvl.verification_source,
  pvl.error_message,
  pvl.created_at,
  b.status as booking_status
FROM payment_verification_log pvl
JOIN bookings b ON b.id = pvl.booking_id
WHERE pvl.success = false
ORDER BY pvl.created_at DESC
LIMIT 20;
```

### Webhook Delivery Status
```sql
SELECT 
  event_type,
  COUNT(*) as total,
  SUM(CASE WHEN signature_valid THEN 1 ELSE 0 END) as valid_signature,
  SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processed,
  AVG(EXTRACT(EPOCH FROM (processed_at - received_at))) as avg_processing_time_seconds
FROM webhook_events
WHERE received_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type;
```

---

## Troubleshooting Common Issues

### Issue: Verification Always Fails
**Check**:
1. Razorpay credentials in `.env`
2. Network connectivity
3. Server logs for errors
4. Database migration applied

### Issue: Webhook Not Received
**Check**:
1. Webhook URL is publicly accessible
2. HTTPS enabled (required by Razorpay)
3. Webhook secret configured
4. Razorpay dashboard webhook status

### Issue: Duplicate Tickets Generated
**Check**:
1. Idempotency logic working
2. Database constraints in place
3. Verification log for duplicate attempts

### Issue: Slow Verification
**Check**:
1. Database query performance
2. Email sending time
3. Network latency
4. Server resource usage

---

## Success Criteria

All tests should pass with:
- ✅ 100% success rate for valid payments
- ✅ < 2 second average verification time
- ✅ 0% overselling incidents
- ✅ 100% ticket delivery rate
- ✅ Graceful handling of all error scenarios
- ✅ No duplicate ticket generation
- ✅ Proper idempotency for retries

## Reporting Issues

When reporting issues, include:
1. Test scenario that failed
2. Expected vs actual results
3. Console logs
4. Server logs
5. Database state
6. Network logs (if relevant)
