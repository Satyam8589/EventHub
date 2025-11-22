# 🚀 FIX: Deployment Timeout Issue (Vercel/Production)

## Problem
Payment verification works locally but fails in deployment (Vercel/Netlify/Production).

## Root Cause
**Serverless function timeout limits:**
- Vercel Free: 10 seconds
- Vercel Pro: 60 seconds
- Netlify: 10 seconds (default)

The ticket generation (with image loading, QR generation, email sending) takes 5-10 seconds, which can exceed the timeout when combined with other operations.

---

## ✅ Solution: Use Vercel Edge Config for Async Processing

We need to ensure the response returns BEFORE the 10-second limit, even with the async ticket sending.

---

## 🔧 Fix 1: Add Route Segment Config

This tells Vercel to allow longer execution time for this specific route.

### File: `src/app/api/payment/verify/route.js`

**Add this at the TOP of the file** (after imports, before the POST function):

```javascript
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { sendNotificationToUser } from "@/lib/notificationHelper";
import { sendTicketToUser } from "@/lib/ticketEmail";

// ⚡ Route segment config for Vercel deployment
export const runtime = 'nodejs'; // Use Node.js runtime (not Edge)
export const maxDuration = 60; // Maximum execution time in seconds (Pro plan)
// For free plan, use: export const maxDuration = 10;

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  // ... rest of the code
```

---

## 🔧 Fix 2: Optimize Ticket Generation

The async ticket sending should already prevent timeout, but let's add a safety timeout.

### File: `src/app/api/payment/verify/route.js`

**Replace the ticket sending code** (around line 279) with this optimized version:

```javascript
    // 📧 SEND TICKET EMAIL WITH QR CODE (in background - don't wait)
    // This prevents timeout issues since ticket generation can take several seconds
    // Use Promise.race to ensure we don't wait too long even in edge cases
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

    // Return success response immediately (don't wait for ticket email)
    return NextResponse.json(successResponse);
```

---

## 🔧 Fix 3: Environment Variables

Make sure ALL environment variables are set in your deployment platform.

### Vercel:
1. Go to **Project Settings** → **Environment Variables**
2. Add these variables:

```
RAZORPAY_KEY_ID=rzp_live_... (or rzp_test_...)
RAZORPAY_KEY_SECRET=your_secret_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_... (same as above)

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (if using)

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

3. **Redeploy** after adding variables

---

## 🔧 Fix 4: Increase Vercel Function Timeout (Pro Plan Only)

If you have Vercel Pro, you can increase timeout:

### File: `vercel.json` (create in project root if doesn't exist)

```json
{
  "functions": {
    "src/app/api/payment/verify/route.js": {
      "maxDuration": 60
    }
  }
}
```

**For Free Plan**: Max is 10 seconds, so we rely on async processing.

---

## 🔧 Fix 5: Add Deployment-Specific Logging

Add logging to see what's happening in production:

### File: `src/app/api/payment/verify/route.js`

Add at the start of the POST function:

```javascript
export async function POST(request) {
  const startTime = Date.now();
  let body = null;

  try {
    console.log("🚀 Payment verification started at:", new Date().toISOString());
    console.log("🌍 Environment:", process.env.NODE_ENV);
    console.log("⚡ Runtime:", process.env.VERCEL_REGION || 'local');
    
    body = await request.json();
    // ... rest of code
```

And before returning response:

```javascript
    const duration = Date.now() - startTime;
    console.log(`⏱️ Payment verification completed in ${duration}ms`);
    
    // Return success response immediately (don't wait for ticket email)
    return NextResponse.json(successResponse);
```

---

## 🔧 Fix 6: Alternative - Use Vercel Cron or Queue

For very reliable ticket delivery, use a queue system:

### Option A: Vercel Cron (Scheduled Function)

Create `src/app/api/cron/send-pending-tickets/route.js`:

```javascript
export async function GET(request) {
  // Check for pending tickets and send them
  // Run every minute via Vercel Cron
}
```

### Option B: Use a Queue Service

- **Vercel Queue** (Beta)
- **Upstash QStash**
- **AWS SQS**
- **Redis Queue**

---

## 📊 Deployment Checklist

### Before Deploying:

- [ ] Add route segment config (`export const maxDuration = 60`)
- [ ] Verify all environment variables in Vercel
- [ ] Test locally with `npm run build && npm start`
- [ ] Check Vercel function logs after deployment
- [ ] Test payment in production
- [ ] Monitor Vercel function execution time

---

## 🧪 Testing in Production

### Step 1: Deploy
```bash
git add .
git commit -m "Fix deployment timeout for payment verification"
git push
```

### Step 2: Check Vercel Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Functions** tab
4. Find `/api/payment/verify`
5. Check execution time and logs

### Step 3: Test Payment

1. Complete a test payment in production
2. Check Vercel logs for:
   ```
   🚀 Payment verification started
   ⏱️ Payment verification completed in XXXms
   ```
3. Should complete in < 2000ms (2 seconds)
4. Ticket sending happens in background

---

## 🎯 Expected Behavior in Production

### Timeline:
```
0ms:    Payment verification starts
500ms:  Signature verified
1000ms: Booking confirmed
1200ms: Payment success notification sent
1300ms: Ticket sending started (background)
1500ms: Response returned to user ✅
        
(Background continues...)
5000ms: Ticket generated
6000ms: Email sent
6500ms: Ticket notification sent ✅
```

**User sees success in ~1.5 seconds**
**Ticket arrives in ~6-7 seconds**

---

## 🚨 Common Deployment Issues

### Issue 1: "Function execution timed out"

**Cause**: Function taking > 10 seconds (free plan)

**Fix**: 
- Add `export const maxDuration = 10`
- Ensure ticket sending is truly async (no await)
- Optimize image loading

### Issue 2: "Missing environment variable"

**Cause**: Env vars not set in Vercel

**Fix**:
- Add all env vars in Vercel dashboard
- Redeploy

### Issue 3: "Cannot find module"

**Cause**: Missing dependency in production

**Fix**:
```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue 4: Ticket not sent

**Cause**: Background process killed after response

**Fix**:
- Vercel keeps function alive for a bit after response
- Add `ticketPromise.catch(() => {})` to prevent unhandled rejection
- Consider using a queue for critical emails

---

## 📝 Quick Fix Summary

**Add to top of `src/app/api/payment/verify/route.js`:**

```javascript
// ⚡ Route segment config for Vercel deployment
export const runtime = 'nodejs';
export const maxDuration = 60; // or 10 for free plan
```

**Ensure ticket sending doesn't use `await`:**

```javascript
// ✅ CORRECT (async, non-blocking)
sendTicketToUser(...).then(...).catch(...);
return NextResponse.json(successResponse);

// ❌ WRONG (blocks response)
await sendTicketToUser(...);
return NextResponse.json(successResponse);
```

**Set all environment variables in Vercel**

**Redeploy and test**

---

## ✅ Verification

After deploying, check:

1. **Vercel Function Logs**: Should show completion in < 2 seconds
2. **User Experience**: Sees success immediately
3. **Email Delivery**: Receives ticket within 10 seconds
4. **Notifications**: Gets both notifications

---

**This should fix your deployment issue! Let me know if you need help with any of these steps.**
