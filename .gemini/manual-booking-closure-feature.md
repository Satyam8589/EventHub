# Manual Booking Closure Feature

## Overview
Added a manual booking closure feature that allows super admins to close event bookings at any time, regardless of the event start time or status.

## Changes Made

### 1. Database Migration
**File**: `supabase_migrations/add_booking_closed_column.sql`

- Added `booking_closed` BOOLEAN column to the `events` table
- Default value: `FALSE`
- Purpose: Allows admins to manually prevent new bookings

### 2. Admin Event Edit Page
**File**: `src/app/admin/events/[id]/edit/page.js`

#### Form State
- Added `booking_closed: false` to initial formData state
- Loads `booking_closed` value when fetching event details

#### UI Addition
- Added toggle checkbox: "🚫 Close Bookings Manually"
- Located below the "Featured Event" checkbox
- Orange-themed checkbox (text-orange-600)
- Helper text: "When enabled, prevents new bookings regardless of event timing"
- Automatically saves when form is submitted

### 3. Event Details Page
**File**: `src/app/events/[id]/page.js`

#### Booking Button Logic Priority
The button now checks conditions in this order:

1. **User Reached Limit** → Shows "Booked" (Green)
2. **Manual Closure** (`event.booking_closed = true`) → Shows "Booking Closed - By Organizer" (Red) ⭐ **NEW**
3. **Event Started** (IST time check) → Shows "Event Started - Booking Closed" (Orange)
4. **Normal State** → Shows "Book Now" button (Blue/Purple gradient)

#### Visual Indicators
- **Manual Closure**: Red background with "By Organizer" subtitle
- **Event Started**: Orange background with "Booking Closed" subtitle
- Clear distinction between admin-controlled and automatic closure

## User Experience

### Admin Workflow
1. Navigate to Admin → Events
2. Click "Edit" on any event
3. Scroll to the "Category and Featured" section
4. Toggle "🚫 Close Bookings Manually" checkbox
5. Save the event

### User-Facing Behavior

#### When booking_closed = FALSE
- Normal booking flow
- Bookings close automatically when event starts (IST)

#### When booking_closed = TRUE
- "Booking Closed - By Organizer" message displayed
- No booking button available
- Users can still view event details
- Takes precedence over event start time check

## Priority Order

```
1. Sold Out (capacity reached)
2. User booking limit reached
3. Manual closure by admin (booking_closed = true) ⭐ NEW
4. Automatic closure (event started in IST)
5. Normal booking available
```

## Technical Details

### Database Field
```sql
booking_closed BOOLEAN DEFAULT FALSE
```

### API Integration
- Field automatically included in event queries
- Saved when updating event via PUT `/api/admin/events/[id]`
- No additional API endpoints needed

### Frontend Checks
```javascript
event.booking_closed ? (
  // Show "Booking Closed - By Organizer"
) : hasEventStarted ? (
  // Show "Event Started - Booking Closed"
) : (
  // Show "Book Now" button
)
```

## Benefits

1. **Flexible Control**: Admins can close bookings anytime (e.g., venue issues, cancellations)
2. **Clear Communication**: Users see "By Organizer" to understand it's a manual decision
3. **No Code Changes Needed**: Toggle works immediately after database migration
4. **Reversible**: Can be toggled on/off anytime before event ends
5. **Priority System**: Manual closure takes precedence over automatic time-based closure

## Use Cases

- **Early Closure**: Close bookings before event starts (e.g., venue capacity reduced)
- **Emergency Situations**: Quickly stop bookings if event is cancelled
- **Maintenance**: Temporarily close bookings while updating event details
- **VIP Events**: Manually control when general bookings open
- **Sold Out Override**: Close bookings even if capacity not reached

## Migration Instructions

Run the SQL migration:
```bash
# Execute the migration file in Supabase SQL Editor or via CLI
psql -f supabase_migrations/add_booking_closed_column.sql
```

Or manually in Supabase Dashboard:
1. Go to SQL Editor
2. Run: `ALTER TABLE events ADD COLUMN IF NOT EXISTS booking_closed BOOLEAN DEFAULT FALSE;`

## Testing Checklist

- [ ] Database column added successfully
- [ ] Toggle appears in event edit form
- [ ] Toggle state saves correctly
- [ ] "Booking Closed - By Organizer" shows when enabled
- [ ] Booking button returns when disabled
- [ ] Works alongside event start time check
- [ ] Priority order is correct (manual > automatic)
- [ ] Users cannot bypass closure by direct API calls

## Notes

- Only SUPER_ADMIN can access event edit page
- Field defaults to FALSE for all existing events
- Compatible with existing IST-based automatic closure
- No impact on past events or completed bookings
