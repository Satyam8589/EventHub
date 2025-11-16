# Database Migration Guide - Atomic Booking Confirmation

This guide explains how to apply the database migrations to prevent ticket overselling and race conditions.

## Problem Solved

Previously, when multiple users tried to book the last ticket simultaneously, both could complete payment and get tickets, leading to overselling. This migration implements **Hard Lock (Database Transaction)** to prevent this issue.

## Solution Overview

The solution uses PostgreSQL functions with row-level locking (`SELECT FOR UPDATE`) to ensure:
- Only one transaction can confirm a booking at a time
- Availability is checked atomically within a transaction
- No overselling is possible, even if 100 users click at the same time
- Failed bookings are marked appropriately

## Migration Steps

### Step 1: Apply Database Functions

Run the following SQL files in your Supabase SQL Editor (in order):

1. **`supabase_migrations/check_availability_atomic.sql`**
   - Creates function to atomically check ticket availability
   - Uses row-level locking to prevent race conditions

2. **`supabase_migrations/atomic_booking_confirmation.sql`**
   - Creates function to atomically confirm bookings
   - Checks availability before confirming
   - Prevents overselling

### Step 2: Verify Migration

After running the migrations, verify the functions exist:

```sql
-- Check if functions exist
SELECT 
  routine_name, 
  routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'check_ticket_availability',
    'confirm_booking_with_availability_check'
  );
```

You should see both functions listed.

### Step 3: Test the Functions

Test the availability check function:

```sql
-- Test availability check (replace with actual event ID)
SELECT check_ticket_availability('your-event-id', 1);
```

Test the confirmation function (use a PENDING booking ID):

```sql
-- Test booking confirmation (replace with actual booking ID and payment ID)
SELECT confirm_booking_with_availability_check(
  'your-booking-id'::UUID,
  'test-payment-id'
);
```

## How It Works

### When User Clicks "Pay Now" (create-order route)

1. **Atomic Availability Check**: Uses `check_ticket_availability()` function
   - Locks the event row (`SELECT FOR UPDATE`)
   - Calculates total booked tickets (CONFIRMED + PENDING)
   - Returns availability status atomically
   - Prevents multiple users from passing the check simultaneously

2. **Create PENDING Booking**: If available, creates a PENDING booking
   - This reserves the tickets temporarily
   - Multiple PENDING bookings can exist, but only one will be confirmed

### When Payment is Verified (verify route)

1. **Atomic Confirmation**: Uses `confirm_booking_with_availability_check()` function
   - Locks the booking row (`SELECT FOR UPDATE`)
   - Locks the event row (`SELECT FOR UPDATE`)
   - Re-checks availability (including all PENDING bookings)
   - **If reserved → confirm**: Only confirms if tickets are still available
   - **If not reserved → show 'Sold Out'**: Marks booking as FAILED if overselling would occur
   - **No overselling possible**: Database transaction ensures atomicity

### Race Condition Prevention

Even if 100 users click at the same time:
- Only one transaction succeeds (the first one to acquire the lock)
- Others fail gracefully without payment being processed
- Failed bookings are marked with appropriate error messages

## Code Changes

The following API routes have been updated:

1. **`src/app/api/payment/create-order/route.js`**
   - Now uses `check_ticket_availability()` RPC call
   - Falls back to old method if RPC fails (backward compatibility)

2. **`src/app/api/payment/verify/route.js`**
   - Now uses `confirm_booking_with_availability_check()` RPC call
   - Atomically checks availability before confirming
   - Returns appropriate error if overselling would occur

## Backward Compatibility

The code includes fallback mechanisms:
- If RPC functions don't exist, it falls back to the old method
- This ensures the system continues to work even if migrations aren't applied
- However, the race condition protection only works with the migrations applied

## Monitoring

After deployment, monitor:
- Failed bookings with `failureReason = 'Not enough tickets available - overselling prevented'`
- This indicates the system is working correctly and preventing overselling

## Rollback

If you need to rollback:

```sql
-- Remove the functions
DROP FUNCTION IF EXISTS confirm_booking_with_availability_check(UUID, TEXT);
DROP FUNCTION IF EXISTS check_ticket_availability(TEXT, INTEGER);
```

The API routes will automatically fall back to the old method.

## Support

If you encounter issues:
1. Check that both functions exist in the database
2. Verify function permissions are granted correctly
3. Check Supabase logs for RPC errors
4. Ensure the booking and event tables have the correct structure

