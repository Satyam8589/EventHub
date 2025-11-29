# 🔍 Webhook System Comprehensive Checklist

**Last Updated:** 2025-11-29 08:26 IST  
**Status:** Ready for Testing

---

## ✅ **1. Database Setup**

### **Tables Created:**
- ✅ `webhook_events` - Logs all incoming webhooks
- ✅ `payment_verification_log` - Tracks verification attempts

### **Columns Added to `bookings` table:**
- ✅ `verification_attempts` (INTEGER)
- ✅ `last_verification_attempt` (TIMESTAMPTZ)
- ✅ `webhook_received_at` (TIMESTAMPTZ)
- ✅ `webhook_processed_at` (TIMESTAMPTZ)

### **Functions Created:**
- ✅ `log_verification_attempt()` - Logs verification attempts

### **Verification Query:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('verification_attempts', 'webhook_received_at', 'webhook_processed_at', 'last_verification_attempt')
ORDER BY column_name;
```
**Expected:** 4 rows returned

---

## ✅ **2. Webhook Code Implementation**

### **File:** `src/app/api/payment/webhook/route.js`

#### **Key Features:**
- ✅ Immediate webhook logging to database (line 49-70)
- ✅ Webhook secret validation (line 72-91)
- ✅ Signature verification (line 93-127)
- ✅ Event type handling (payment.captured, payment.failed)
- ✅ Booking tracking updates (line 341-364)
- ✅ Error logging (not silently swallowed)
- ✅ Uses `confirmedBooking.id` (FIXED - was using wrong variable)

#### **Critical Fix Applied:**
```javascript
// BEFORE (WRONG):
.eq("id", booking.id);  // ❌ booking is undefined here

// AFTER (CORRECT):
.eq("id", confirmedBooking.id);  // ✅ Uses correct variable
```

---

## ✅ **3. Environment Variables**

### **Required Variables:**

#### **Production (Vercel):**
- ✅ `RAZORPAY_KEY_ID`
- ✅ `RAZORPAY_KEY_SECRET`
- ⚠️ `RAZORPAY_WEBHOOK_SECRET` - **MUST BE CONFIGURED**

#### **Local (.env.local):**
- ✅ `RAZORPAY_KEY_ID`
- ✅ `RAZORPAY_KEY_SECRET`
- ✅ `RAZORPAY_WEBHOOK_SECRET`

### **Verification:**
Check Vercel Dashboard → Your Project → Settings → Environment Variables

---

## ✅ **4. Razorpay Webhook Configuration**

### **Webhook URL:**
```
https://www.eventhubx.site/api/payment/webhook
```

### **Events Subscribed:**
- ✅ `payment.captured`
- ✅ `payment.failed`

### **Webhook Secret:**
- ✅ Secret configured in Razorpay
- ⚠️ **MUST match** `RAZORPAY_WEBHOOK_SECRET` in Vercel

### **Status:**
- ✅ Enabled
- ✅ Active

### **Verification:**
Razorpay Dashboard → Settings → Webhooks → Click your webhook → Check:
- URL is correct
- Events are selected
- Secret is set (not "Not provided")
- Status is "Enabled"

---

## ✅ **5. Code Deployment**

### **Latest Commits:**
```
130eded - fix: Use correct booking ID for webhook tracking updates
1390743 - feat: Enhanced payment verification with webhook logging
```

### **Deployment Status:**
- ✅ Code committed to Git
- ✅ Code pushed to GitHub
- ⏳ Vercel deployment (check dashboard)

### **Verification:**
```bash
git log --oneline -3
git status
```

---

## 🧪 **6. Testing Checklist**

### **Before Testing:**
1. ✅ Database migration applied
2. ✅ Code deployed to production
3. ✅ Vercel deployment complete (green checkmark)
4. ⚠️ Webhook secret configured in Vercel
5. ⚠️ Webhook secret matches Razorpay

### **Test Payment:**
1. Go to https://www.eventhubx.site
2. Book a ticket
3. Complete payment with test card: `4111 1111 1111 1111`
4. Wait for success message

### **Verification Queries:**

#### **Query 1: Check Booking**
```sql
SELECT 
  id,
  status,
  "paymentId",
  verification_attempts,
  last_verification_attempt,
  webhook_received_at,
  webhook_processed_at,
  "createdAt"
FROM bookings
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Expected Results:**
- ✅ `status` = `CONFIRMED`
- ✅ `verification_attempts` ≥ 1 (not 0!)
- ✅ `webhook_received_at` = timestamp (not NULL!)
- ✅ `webhook_processed_at` = timestamp (not NULL!)

---

#### **Query 2: Check Webhook Events**
```sql
SELECT 
  event_type,
  razorpay_payment_id,
  booking_id,
  signature_valid,
  processed,
  processing_error,
  received_at,
  processed_at
FROM webhook_events
ORDER BY received_at DESC
LIMIT 1;
```

**Expected Results:**
- ✅ `event_type` = `payment.captured`
- ✅ `signature_valid` = `true`
- ✅ `processed` = `true`
- ✅ `processing_error` = `NULL`
- ✅ `booking_id` = matches booking ID from Query 1

---

#### **Query 3: Check Verification Log**
```sql
SELECT 
  booking_id,
  verification_source,
  success,
  attempt_number,
  response_time_ms,
  created_at
FROM payment_verification_log
ORDER BY created_at DESC
LIMIT 3;
```

**Expected Results:**
- ✅ At least 1 entry with `verification_source` = `'client'`
- ✅ `success` = `true`

---

## 🔧 **7. Troubleshooting**

### **If webhook_received_at is NULL:**

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Latest → Functions
   - Look for `/api/payment/webhook` logs
   - Check for errors

2. **Check Webhook Secret:**
   ```sql
   SELECT processing_error FROM webhook_events ORDER BY received_at DESC LIMIT 1;
   ```
   - If error = "Webhook secret not configured" → Add to Vercel
   - If error = "Invalid signature" → Secret mismatch

3. **Check Razorpay Webhook Deliveries:**
   - Razorpay Dashboard → Webhooks → Recent Deliveries
   - Look for 200 status (success) or error codes

### **If verification_attempts is 0:**

1. **Check if client verification is running:**
   - Look at browser console during payment
   - Should see "Payment verified successfully!"

2. **Check verification API:**
   ```sql
   SELECT * FROM payment_verification_log ORDER BY created_at DESC LIMIT 5;
   ```
   - If empty → Client verification not calling API

---

## 📊 **8. Success Criteria**

### **All of these MUST be true:**

- ✅ Payment completes successfully
- ✅ Booking status = `CONFIRMED`
- ✅ `webhook_events` table has entry with `signature_valid = true`
- ✅ `webhook_events.processing_error` is `NULL`
- ✅ `bookings.webhook_received_at` has timestamp
- ✅ `bookings.webhook_processed_at` has timestamp
- ✅ User receives ticket email
- ✅ Ticket appears in My Events page

---

## 🎯 **Current Status**

### **Completed:**
- ✅ Database migration
- ✅ Webhook handler code
- ✅ Error logging
- ✅ Bug fixes (booking ID reference)
- ✅ Code deployed

### **Pending:**
- ⚠️ Verify `RAZORPAY_WEBHOOK_SECRET` in Vercel
- ⚠️ Wait for Vercel deployment to complete
- ⚠️ Test payment and verify results

---

## 📝 **Next Steps**

1. **Wait 2-3 minutes** for Vercel deployment
2. **Verify webhook secret** is in Vercel environment variables
3. **Make test payment**
4. **Run verification queries**
5. **Check all success criteria**

---

## 🚨 **Critical Reminders**

1. **Webhook secret MUST be the same** in Razorpay and Vercel
2. **Database columns MUST exist** in production (run migration)
3. **Code MUST be deployed** to production (not just committed)
4. **Old bookings will have NULL** tracking columns (only new ones populate)

---

**Everything is ready! Just need to:**
1. ✅ Confirm webhook secret in Vercel
2. ✅ Wait for deployment
3. ✅ Test payment
