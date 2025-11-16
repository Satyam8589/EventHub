# Payment Transaction ID Storage

## Overview

The system now correctly stores the **Razorpay transaction ID** (payment ID) in the `paymentId` field of the bookings table after successful payment verification.

## Flow

### 1. Order Creation (PENDING)
When user clicks "Pay Now":
- Creates PENDING booking with `paymentId = "PENDING_{razorpayOrder.id}"`
- This is a temporary placeholder until payment is verified

### 2. Payment Verification (CONFIRMED)
When payment is successfully verified:
- Receives `razorpay_payment_id` from Razorpay (the actual transaction ID)
- Calls database function `confirm_booking_with_availability_check()`
- **Stores the transaction ID** in `paymentId` field
- Updates status from PENDING → CONFIRMED

### 3. Database Storage
```sql
UPDATE bookings
SET 
  status = 'CONFIRMED',
  "paymentId" = p_payment_id, -- ✅ Stores actual Razorpay transaction ID (e.g., "pay_ABC123")
  "updatedAt" = NOW()
WHERE id = p_booking_id
```

## Transaction ID Format

Razorpay payment IDs typically look like:
- `pay_ABC123XYZ456` (transaction ID)
- This is different from the order ID (`order_ABC123`)

## Code Locations

### Database Function
- **File**: `supabase_migrations/atomic_booking_confirmation.sql`
- **Line**: 104
- **Action**: Stores `p_payment_id` (transaction ID) in `paymentId` field

### API Route
- **File**: `src/app/api/payment/verify/route.js`
- **Line**: 134 - Passes `razorpay_payment_id` to database function
- **Line**: 180 - Uses stored `paymentId` from confirmed booking

## Important Notes

1. ✅ **Transaction ID is stored** after payment success
2. ✅ **paymentId is NOT modified** after scanning (scan data goes to `scannedqrs`)
3. ✅ **Original payment ID preserved** throughout booking lifecycle
4. ✅ **Used for payment tracking** and refunds if needed

## Example Flow

```
1. User clicks "Pay Now"
   → paymentId = "PENDING_order_ABC123"

2. User completes payment
   → Razorpay returns: razorpay_payment_id = "pay_XYZ789"

3. Payment verification
   → Database updates: paymentId = "pay_XYZ789" ✅
   → Status: PENDING → CONFIRMED

4. Ticket scanning
   → paymentId remains = "pay_XYZ789" (unchanged) ✅
   → scannedqrs = {"1": "2024-01-01T10:00:00Z"}
```

## Verification

To verify the transaction ID is stored correctly:

```sql
SELECT 
  id,
  status,
  "paymentId",
  "createdAt",
  "updatedAt"
FROM bookings
WHERE status = 'CONFIRMED'
ORDER BY "updatedAt" DESC
LIMIT 10;
```

You should see:
- `paymentId` starting with `pay_` (transaction ID)
- NOT starting with `PENDING_` (that would indicate unverified payment)

