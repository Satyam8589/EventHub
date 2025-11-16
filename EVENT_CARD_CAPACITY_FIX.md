# Event Card Capacity Fix

## Problem

Event cards were showing incorrect availability because they were counting PENDING bookings. When users clicked "Pay Now" and opened the Razorpay payment window, the capacity was immediately reduced, even if the user cancelled payment.

## Solution

Updated all event-related API routes to **only count CONFIRMED bookings** when calculating availability for event cards and event detail pages.

## Changes Made

### 1. ✅ Events List API
**File**: `src/app/api/events/route.js`

**Before**: Counted ALL bookings (including PENDING)
```javascript
const { data: bookings } = await supabase
  .from("bookings")
  .select("tickets")
  .eq("eventId", event.id);
```

**After**: Only counts CONFIRMED bookings
```javascript
const { data: bookings } = await supabase
  .from("bookings")
  .select("tickets")
  .eq("eventId", event.id)
  .eq("status", "CONFIRMED"); // ✅ Only count CONFIRMED bookings
```

### 2. ✅ Event Detail API
**File**: `src/app/api/events/[id]/route.js`

**Before**: Counted ALL bookings (including PENDING)
```javascript
const { count: bookingsCount } = await supabase
  .from("bookings")
  .select("*", { count: "exact", head: true })
  .eq("eventId", id);
```

**After**: Only counts CONFIRMED bookings and sums tickets
```javascript
const { data: bookings } = await supabase
  .from("bookings")
  .select("tickets")
  .eq("eventId", id)
  .eq("status", "CONFIRMED"); // ✅ Only count CONFIRMED bookings

const totalTickets = bookings?.reduce(
  (sum, booking) => sum + (booking.tickets || 0), 
  0
) || 0;
```

## How It Works Now

### Event Card Display
1. **Events List Page** (`/events`)
   - Fetches events from `/api/events`
   - Shows availability based on CONFIRMED bookings only
   - EventCard component displays correct "spots left"

2. **Event Detail Page** (`/events/[id]`)
   - Fetches event from `/api/events/[id]`
   - Shows availability based on CONFIRMED bookings only
   - Displays correct capacity bar and available spots

### Flow
```
User Views Event Card
    ↓
API fetches events
    ↓
Counts only CONFIRMED bookings
    ↓
Displays: "X spots left" (accurate)
    ↓
User clicks "Pay Now"
    ↓
PENDING booking created
    ↓
Capacity: UNCHANGED ✅ (still shows correct availability)
    ↓
User completes payment
    ↓
Status: PENDING → CONFIRMED
    ↓
Capacity: NOW REDUCED ✅ (card updates on refresh)
```

## Benefits

- ✅ **Accurate availability display** - Only shows CONFIRMED bookings
- ✅ **No false sold-out** - PENDING bookings don't affect display
- ✅ **Consistent with backend** - Frontend matches backend logic
- ✅ **Better UX** - Users see real availability, not reserved capacity

## Testing Checklist

- [ ] View events list → Verify availability shows correctly
- [ ] Click on event → Verify detail page shows correct availability
- [ ] Create PENDING booking → Verify card still shows same availability
- [ ] Complete payment → Verify card updates to show reduced availability
- [ ] Cancel payment → Verify card still shows original availability

## Related Files

- `src/components/EventCard.js` - Displays event card (uses data from API)
- `src/app/events/page.js` - Events list page
- `src/app/events/[id]/page.js` - Event detail page
- `src/app/api/events/route.js` - Events list API (updated)
- `src/app/api/events/[id]/route.js` - Event detail API (updated)

## Notes

- Event cards automatically update when page is refreshed
- Real-time updates would require WebSocket or polling (not implemented)
- The `registered` field in EventCard uses `event._count?.bookings` which now only counts CONFIRMED bookings

