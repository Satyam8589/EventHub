# Scanner Verification Debugging Guide

## Issue

Admin scanner not verifying bookings when correct booking ID is entered.

## Root Causes & Solutions

### 1. **Booking Status Issue (Most Common)**

**Problem:** Bookings must have status = "CONFIRMED" to be scanned. If a booking has status "PENDING", "CANCELLED", or "REFUNDED", it will be rejected.

**Solution:**

- Check the booking status using the debug endpoint: `/api/admin/check-booking?bookingId=YOUR_BOOKING_ID`
- If status is not "CONFIRMED", use the confirm booking endpoint to manually confirm it
- Or check your booking creation process to ensure bookings are created with "CONFIRMED" status

**To manually confirm a booking:**

```javascript
// POST to /api/admin/confirm-booking
{
  "bookingId": "YOUR_BOOKING_ID",
  "adminId": "YOUR_ADMIN_USER_ID"
}
```

### 2. **Event Mismatch**

**Problem:** The booking must be for the event that the admin has selected in the scanner.

**Solution:**

- Ensure the admin selects the correct event before scanning
- Verify the booking's eventId matches the selected event

### 3. **Already Scanned**

**Problem:** Each booking can only be scanned once. Duplicate scans are prevented.

**Solution:**

- Check if the ticket has already been verified
- Look at the "Recent Verifications" section in the scanner page

### 4. **Admin Authorization**

**Problem:** The scanner must be assigned as an EVENT_ADMIN for the event.

**Solution:**

- Verify the admin is assigned to the event in the EventAdmin table
- Check using: `/api/admin/events?adminId=USER_ID`

## Debugging Tools Created

### 1. Check Booking Details

**Endpoint:** `GET /api/admin/check-booking?bookingId=XXX`

This will return:

- Whether the booking exists
- Booking status
- Event details
- User details
- Verification history
- Whether it can be scanned (and why not if it can't)

### 2. Confirm Booking

**Endpoint:** `POST /api/admin/confirm-booking`

```json
{
  "bookingId": "clxxxxxx",
  "adminId": "firebase_user_id"
}
```

This will manually change a booking's status to CONFIRMED.

### 3. Enhanced Logging

The scan-ticket API now logs:

- Booking ID received (with type and length)
- Scanner ID and Event ID
- Whether booking was found
- Booking status
- Event match status
- Verification count

Check the browser console and server logs for detailed debugging information.

## How to Debug

### Step 1: Check if booking exists

```
GET /api/admin/check-booking?bookingId=YOUR_BOOKING_ID
```

### Step 2: Review the response

- `found: false` → Booking doesn't exist, check the ID
- `found: true` → Look at the `canScan` field and `reason`

### Step 3: Fix the issue

- If status is not CONFIRMED → Use confirm-booking endpoint
- If already scanned → This is expected, can't scan twice
- If wrong event → Admin needs to select the correct event

### Step 4: Try scanning again

The enhanced error messages will now show:

- Exact booking status
- Helpful suggestions
- All booking details even when it fails

## UI Improvements

The scanner now shows:

- ✅ Booking status with color coding (CONFIRMED=green, PENDING=yellow, etc.)
- ⚠️ Additional details/suggestions when verification fails
- 📊 All booking information even when scan fails

## Common Scenarios

### Scenario 1: "Booking not found"

- Double-check the booking ID for typos
- Ensure you're using the correct booking ID (not event ID or user ID)
- Use the check-booking endpoint to see what bookings exist

### Scenario 2: "Booking status is PENDING"

- The booking hasn't been confirmed yet
- Use the confirm-booking endpoint to confirm it
- Or update your booking creation flow to auto-confirm

### Scenario 3: "Ticket already scanned"

- This booking was already verified
- Check the "Recent Verifications" section
- This is expected behavior - each ticket can only be scanned once

### Scenario 4: "This ticket is not for this event"

- The admin has the wrong event selected
- Switch to the correct event in the dropdown

### Scenario 5: "You are not authorized"

- The scanner is not assigned as an EVENT_ADMIN for this event
- Contact a super admin to be assigned to the event

## Testing Workflow

1. Create a test booking
2. Check its status: `GET /api/admin/check-booking?bookingId=XXX`
3. If needed, confirm it: `POST /api/admin/confirm-booking`
4. Scan the booking in the scanner UI
5. Check browser console and server logs for detailed info

## Next Steps

1. Test the scanner with a known booking ID
2. Check the browser console for detailed logs
3. Use the check-booking endpoint to verify booking details
4. Confirm any pending bookings if needed
5. Report any other issues with the full error message
