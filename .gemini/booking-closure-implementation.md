# Event Booking Closure Implementation

## Overview
Implemented automatic booking closure when events start, using IST (Indian Standard Time) timezone for accurate time checking.

## Changes Made

### 1. EventCard Component (`src/components/EventCard.js`)

#### Updated Event Status Calculation
- **Changed from UTC to IST timezone** for all event time comparisons
- Added logic to parse event start time (supports both 12-hour and 24-hour formats)
- Created `eventStartIST` variable that combines event date and time in IST
- Added `hasEventStarted` check that compares current IST time with event start time

#### Updated Booking Button Logic
- Added new condition to check if event has started
- Priority order for button display:
  1. **Sold Out** - When capacity is reached
  2. **Event Started** - When event has started (NEW)
  3. **Expired** - When event has ended
  4. **Details** - Normal state (can book)

#### Visual Feedback
- "Event Started" message displayed in orange background
- Shows "Booking Closed" subtitle
- Prevents users from clicking to book

### 2. Event Details Page (`src/app/events/[id]/page.js`)

#### Added Event Start Time Check
- Implemented same IST-based time checking logic
- Parses event time from both 12-hour (AM/PM) and 24-hour formats
- Calculates exact event start datetime in IST timezone
- Sets `hasEventStarted` flag when current IST time >= event start time

#### Updated Booking Button
- Added "Event Started" state between "Booked" and normal booking states
- Shows orange button with "Event Started" and "Booking Closed" text
- Prevents booking modal from opening when event has started

## Technical Details

### IST Timezone Handling
```javascript
// Get current time in IST
const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
```

### Time Parsing Logic
Supports both formats:
- **12-hour format**: "2:30 PM", "10:00 AM"
- **24-hour format**: "14:30", "10:00"

### Event Start Time Calculation
1. Parse the event date from database (stored in UTC)
2. Convert to IST timezone
3. Parse the time string (event.time field)
4. Combine date and time to create exact start datetime in IST
5. Compare with current IST time

## User Experience

### Before Event Starts
- Users see "Details" button on event cards
- Can click to view event details and book tickets

### When Event Starts
- Button changes to "Event Started - Booking Closed"
- Orange color indicates booking is no longer available
- Users can still view event details but cannot book

### After Event Ends
- Event marked as "Past" or "Expired"
- Different visual treatment

## Benefits

1. **Accurate Time Checking**: Uses IST timezone instead of UTC for Indian events
2. **Automatic Closure**: No manual intervention needed to close bookings
3. **Clear Communication**: Users immediately see that booking is closed
4. **Prevents Late Bookings**: No one can book after event has started
5. **Consistent Behavior**: Same logic applied to both event cards and detail pages

## Testing Recommendations

1. Test with events starting in different times (AM/PM)
2. Verify IST timezone calculation is correct
3. Check behavior at exact event start time
4. Test with both 12-hour and 24-hour time formats
5. Verify on both event listing pages and detail pages

## Notes

- Booking closes at the **exact event start time**, not at the start of the day
- Time comparison uses IST timezone throughout
- The check happens on the client side, so it updates in real-time
- No database changes required - uses existing event.date and event.time fields
