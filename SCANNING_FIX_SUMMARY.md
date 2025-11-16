# Scanning and PaymentId Fix Summary

## Changes Made

### 1. ✅ PaymentId No Longer Modified After Scanning

**Problem**: When tickets were scanned, the `paymentId` field was being overwritten with scan data, losing the original payment information.

**Solution**: 
- Scanning now **ONLY** updates the `scannedqrs` column
- `paymentId` remains unchanged after scanning (preserves original payment ID)
- Scan data is stored exclusively in `scannedqrs` column

**Files Updated**:
- `src/app/api/admin/scan-ticket/route.js` - Removed duplicate `paymentId` update
- `src/app/api/admin/verify-ticket/route.js` - Updated to use `scannedqrs` instead of `paymentId`

### 2. ✅ PENDING Bookings Immediately Reserve Capacity

**Status**: Already working correctly, but added clarifying comments.

**How It Works**:
- When a PENDING booking is created (with `paymentId = PENDING_${razorpayOrder.id}`), it's **immediately counted** in capacity calculations
- The SQL functions (`check_ticket_availability` and `confirm_booking_with_availability_check`) include PENDING bookings in their calculations
- This means tickets are **reserved instantly** when user clicks "Pay Now"

**Files Updated**:
- `src/app/api/payment/create-order/route.js` - Added clarifying comments

## Technical Details

### Before (Scanning)
```javascript
// ❌ OLD: Updated both scannedqrs AND paymentId
.update({
  scannedqrs: scannedTicketsData,
  paymentId: `SCANNED_TICKETS_${JSON.stringify(scannedTicketsData)}`, // ❌ Lost original payment ID
  updatedAt: scannedAt,
})
```

### After (Scanning)
```javascript
// ✅ NEW: Only updates scannedqrs, paymentId remains unchanged
.update({
  scannedqrs: scannedTicketsData,
  updatedAt: scannedAt,
  // paymentId is NOT modified - preserves original payment ID
})
```

### Capacity Reservation Flow

1. **User clicks "Pay Now"**
   - Availability check includes PENDING bookings
   - If available, creates PENDING booking
   - **Tickets are immediately reserved** ✅

2. **User completes payment**
   - Payment verification confirms booking
   - Status changes from PENDING → CONFIRMED
   - Capacity remains the same (already counted)

3. **Ticket scanning**
   - Updates `scannedqrs` column only
   - `paymentId` remains unchanged (preserves payment info)
   - Capacity is not affected by scanning

## Database Schema

### Bookings Table Columns Used:
- `paymentId` - Stores payment information (PENDING_${orderId} → actual payment ID)
- `scannedqrs` - Stores scan data as JSONB (e.g., `{"1": "2024-01-01T10:00:00Z"}`)
- `status` - PENDING → CONFIRMED → (potentially COMPLETED)

### Important Notes:
- `paymentId` should **NEVER** be modified after initial creation
- All scan data goes to `scannedqrs` column
- PENDING bookings are counted in capacity immediately

## Migration Notes

If you have existing bookings with scan data in `paymentId`:
- The code includes legacy support to read from old format
- Consider running the migration script in `manual-migration.sql` to move data to `scannedqrs`

## Testing Checklist

- [ ] Create a booking and verify `paymentId` is set correctly
- [ ] Scan a ticket and verify `scannedqrs` is updated
- [ ] Verify `paymentId` remains unchanged after scanning
- [ ] Test with multiple PENDING bookings to verify capacity reservation
- [ ] Verify availability decreases immediately when PENDING booking is created

