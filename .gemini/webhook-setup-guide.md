# Razorpay Webhook Setup Guide

## Overview
This guide explains how to set up Razorpay webhooks to ensure payment verification happens server-side, making the system more reliable and secure.

## Why Webhooks?
Webhooks provide a server-side backup for payment verification:
- **Reliability**: Works even if user closes browser after payment
- **Security**: Server-side verification independent of client
- **Speed**: Parallel processing with client-side verification
- **Recovery**: Automatic retry if client verification fails

## Setup Steps

### 1. Get Your Webhook Secret
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **Webhooks**
3. Click **Create New Webhook** or **+ Add New Webhook**
4. Configure the webhook:
   - **Webhook URL**: `https://your-domain.com/api/payment/webhook`
   - **Secret**: Generate a strong secret (save this!)
   - **Active Events**: Select these events:
     - ✅ `payment.captured`
     - ✅ `payment.failed`
5. Click **Create Webhook**

### 2. Add Webhook Secret to Environment Variables

Add to your `.env.local` file:
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Important**: Keep this secret secure! Never commit it to version control.

### 3. Deploy the Webhook Handler

The webhook handler is already implemented at:
```
src/app/api/payment/webhook/route.js
```

Deploy your application to make the webhook endpoint accessible.

### 4. Test the Webhook

#### Using Razorpay Dashboard
1. Go to **Settings** → **Webhooks**
2. Click on your webhook
3. Click **Send Test Webhook**
4. Select `payment.captured` event
5. Check your server logs for webhook processing

#### Using a Test Payment
1. Make a test payment using Razorpay test mode
2. Check server logs for:
   ```
   🔔 Webhook received at: [timestamp]
   ✅ Webhook signature verified
   💰 Processing payment.captured
   ✅ Booking confirmed via webhook
   ```

### 5. Monitor Webhook Delivery

#### Check Webhook Logs in Razorpay
1. Go to **Settings** → **Webhooks**
2. Click on your webhook
3. View **Recent Deliveries** tab
4. Check for successful deliveries (200 status code)

#### Check Application Logs
Monitor your application logs for:
- Webhook receipt confirmation
- Signature verification
- Booking confirmation
- Email sending

## Webhook Event Flow

### payment.captured Event
```
1. User completes payment on Razorpay
2. Razorpay sends webhook to your server
3. Server verifies webhook signature
4. Server confirms booking atomically
5. Server sends ticket email
6. Server sends push notification
7. Server responds 200 OK to Razorpay
```

### payment.failed Event
```
1. Payment fails on Razorpay
2. Razorpay sends webhook to your server
3. Server verifies webhook signature
4. Server marks booking as FAILED
5. Server sends failure notification
6. Server responds 200 OK to Razorpay
```

## Security Features

### Signature Verification
Every webhook request is verified using HMAC SHA256:
```javascript
const expectedSignature = crypto
  .createHmac("sha256", webhookSecret)
  .update(rawBody)
  .digest("hex");
```

### Idempotency
- Duplicate webhooks are handled gracefully
- Already confirmed bookings return success
- Prevents double ticket generation

### Rate Limiting
Consider adding rate limiting to webhook endpoint:
```javascript
// Example using Vercel Edge Config
if (requestCount > 100) {
  return new Response('Too many requests', { status: 429 });
}
```

## Troubleshooting

### Webhook Not Receiving Events
1. **Check URL**: Ensure webhook URL is publicly accessible
2. **Check HTTPS**: Razorpay requires HTTPS in production
3. **Check Firewall**: Ensure no firewall blocking Razorpay IPs
4. **Check Logs**: Look for incoming requests in server logs

### Signature Verification Failing
1. **Check Secret**: Ensure `RAZORPAY_WEBHOOK_SECRET` matches dashboard
2. **Check Encoding**: Ensure raw body is used (not parsed JSON)
3. **Check Headers**: Verify `x-razorpay-signature` header is present

### Booking Not Confirming
1. **Check Database**: Ensure booking exists with PENDING status
2. **Check Migration**: Run `payment_verification_tracking.sql` migration
3. **Check Logs**: Look for RPC errors in server logs
4. **Check Capacity**: Ensure event has available tickets

### Duplicate Webhooks
This is normal! Razorpay may send duplicate webhooks. Our system handles this:
- Checks if booking already confirmed
- Returns success for idempotent requests
- Logs duplicate attempts for monitoring

## Monitoring & Alerts

### Key Metrics to Track
1. **Webhook Delivery Rate**: % of webhooks successfully received
2. **Signature Verification Rate**: % of webhooks with valid signatures
3. **Booking Confirmation Rate**: % of webhooks that confirm bookings
4. **Processing Time**: Average time to process webhook

### Set Up Alerts
Alert on:
- High webhook failure rate (>5%)
- Signature verification failures
- Booking confirmation failures
- Processing time >5 seconds

### Database Queries for Monitoring

#### Recent Webhook Events
```sql
SELECT 
  event_type,
  signature_valid,
  processed,
  received_at,
  processed_at
FROM webhook_events
ORDER BY received_at DESC
LIMIT 100;
```

#### Failed Verifications
```sql
SELECT 
  booking_id,
  verification_source,
  error_message,
  created_at
FROM payment_verification_log
WHERE success = false
ORDER BY created_at DESC
LIMIT 50;
```

#### Verification Success Rate
```sql
SELECT 
  verification_source,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM payment_verification_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY verification_source;
```

## Testing Checklist

- [ ] Webhook URL is publicly accessible
- [ ] Webhook secret is configured in environment
- [ ] Test payment triggers webhook
- [ ] Signature verification passes
- [ ] Booking gets confirmed
- [ ] Ticket email is sent
- [ ] Push notification is sent
- [ ] Duplicate webhooks are handled
- [ ] Failed payments are marked correctly
- [ ] Logs show successful processing

## Production Deployment

### Before Going Live
1. ✅ Test webhook with Razorpay test mode
2. ✅ Verify all environment variables are set
3. ✅ Run database migrations
4. ✅ Test with real payment in test mode
5. ✅ Set up monitoring and alerts
6. ✅ Document webhook URL for team

### After Going Live
1. Monitor webhook delivery for first 24 hours
2. Check booking confirmation rate
3. Verify email delivery
4. Monitor error logs
5. Set up automated alerts

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify webhook configuration in Razorpay dashboard
3. Test with Razorpay test mode first
4. Contact Razorpay support if webhook delivery fails

## Additional Resources

- [Razorpay Webhook Documentation](https://razorpay.com/docs/webhooks/)
- [Razorpay Payment Events](https://razorpay.com/docs/webhooks/payloads/payment/)
- [Webhook Security Best Practices](https://razorpay.com/docs/webhooks/validate-test/)
