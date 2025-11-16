# PENDING Bookings Capacity Fix

## Problem

When a user clicked "Pay Now" and Razorpay payment window opened, a PENDING booking was created and **immediately counted in capacity**. If the user cancelled the payment, the PENDING booking remained in the database and capacity stayed reduced, even though no payment was made.

## Solution

**PENDING bookings no longer count toward capacity**. Capacity is **only reduced when payment succeeds** (status = CONFIRMED).

## Changes Made

### 1. ✅ Availability Check Function
**File**: `supabase_migrations/check_availability_atomic.sql`

**Before**: Counted both CONFIRMED and PENDING bookings
```sql
AND status IN ('CONFIRMED', 'PENDING');
```

**After**: Only counts CONFIRMED bookings
```sql
AND status = 'CONFIRMED'; -- ✅ Only count CONFIRMED bookings
```

### 2. ✅ Booking Confirmation Function
**File**: `supabase_migrations/atomic_booking_confirmation.sql`

**Before**: Counted all PENDING bookings when confirming
```sql
AND status IN ('CONFIRMED', 'PENDING');
```

**After**: Only counts CONFIRMED bookings, then adds the current booking being confirmed
```sql
AND status = 'CONFIRMED'; -- ✅ Only count CONFIRMED bookings
-- Then adds: v_total_booked := v_total_booked + v_booking.tickets;
```

### 3. ✅ Create Order Route
**File**: `src/app/api/payment/create-order/route.js`

- Updated comments to clarify PENDING bookings don't count
- Updated fallback code to only count CONFIRMED bookings

### 4. ✅ Events Route
**File**: `src/app/api/events/[id]/route.js`

- Updated to only count CONFIRMED bookings for availability display

## How It Works Now

### Flow Diagram

```
User Clicks "Pay Now"
    ↓
[Check Availability]
    ↓ (Only counts CONFIRMED bookings)
Available? → Create PENDING booking
    ↓
Capacity: UNCHANGED ✅
    ↓
User Completes Payment
    ↓
[Atomic Confirmation Check]
    ↓ (Counts CONFIRMED + this booking)
Available? → CONFIRMED
    ↓
Capacity: REDUCED ✅
```

### Scenario: User Cancels Payment

1. **User clicks "Pay Now"**
   - Availability check: Only counts CONFIRMED bookings
   - Creates PENDING booking
   - **Capacity: UNCHANGED** ✅

2. **User cancels payment**
   - PENDING booking remains in database
   - **Capacity: STILL UNCHANGED** ✅
   - Other users can still book tickets

3. **User completes payment**
   - Confirmation check: Counts CONFIRMED + this booking
   - If available → Status: PENDING → CONFIRMED
   - **Capacity: NOW REDUCED** ✅

### Race Condition Prevention

Even with this change, race conditions are still prevented:

1. **Multiple users click "Pay Now" simultaneously**
   - All can create PENDING bookings (capacity not reduced)
   - All can pass availability check

2. **Multiple users complete payment**
   - First payment to verify: Counts CONFIRMED + this booking → Confirms ✅
   - Second payment to verify: Counts CONFIRMED (including first) + this booking → May exceed capacity → FAILED ❌

3. **Result**: Only first payment succeeds, no overselling

## Benefits

- ✅ **Capacity not reduced** until payment succeeds
- ✅ **Cancelled payments don't affect capacity**
- ✅ **Race conditions still prevented** (atomic confirmation check)
- ✅ **No overselling possible** (database-level guarantee)
- ✅ **Accurate availability display** (only shows CONFIRMED bookings)

## Database Migration

After applying the updated SQL functions:

1. Run `supabase_migrations/check_availability_atomic.sql` (updated)
2. Run `supabase_migrations/atomic_booking_confirmation.sql` (updated)

The functions will now only count CONFIRMED bookings.

## Testing Checklist

- [ ] Create PENDING booking → Verify capacity NOT reduced
- [ ] Cancel payment → Verify capacity still NOT reduced
- [ ] Complete payment → Verify capacity IS reduced
- [ ] Test with multiple simultaneous bookings → Verify only first succeeds
- [ ] Check availability display → Verify shows correct count (CONFIRMED only)

## Important Notes

- PENDING bookings remain in database (for tracking/analytics)
- They just don't count toward capacity
- Consider adding a cleanup job to remove old PENDING bookings (optional)
- FAILED bookings also don't count (only CONFIRMED)

