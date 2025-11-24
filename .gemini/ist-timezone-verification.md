# Automatic Booking Closure - IST Timezone Verification

## ✅ Confirmation: System Uses IST (Indian Standard Time)

The system is **already configured** to automatically close bookings when events start, using **IST timezone** (not UTC).

## 🕐 How It Works

### Default Behavior (No Admin Interference)

1. **Before Event Starts** (IST)
   - Users can book tickets ✅
   - "Details" button shows on event cards
   - "Book Now" button shows on event details page

2. **When Event Starts** (IST)
   - Bookings close **automatically** 🔒
   - "Event Started - Booking Closed" message appears
   - No admin action required

3. **After Event Ends** (IST)
   - Event marked as "Past"
   - Different visual treatment

## 📍 IST Timezone Implementation

### Event Details Page (`src/app/events/[id]/page.js`)

**Lines 255-290**: IST timezone check
```javascript
// Get current time in IST
const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

// Parse event date and time
const eventDate = new Date(event.date);
// ... parse hours and minutes from event.time ...

// Create event start datetime in IST
const eventDateIST = new Date(eventDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
const eventStartIST = new Date(eventDateIST.getFullYear(), eventDateIST.getMonth(), eventDateIST.getDate(), hours, minutes, 0);

// Check if event has started
hasEventStarted = nowIST >= eventStartIST;
```

### EventCard Component (`src/components/EventCard.js`)

**Lines 108-161**: IST timezone check
```javascript
// Get current time in IST
const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

// Create event start datetime in IST
const eventDateIST = new Date(startDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
const eventStartIST = new Date(eventDateIST.getFullYear(), eventDateIST.getMonth(), eventDateIST.getDate(), hours, minutes, 0);

// Check if event has started
const hasEventStarted = eventStartIST && nowIST >= eventStartIST;
```

## 🎯 Booking Closure Logic Priority

```javascript
if (event.booking_closed) {
  // 1. Manual closure by admin (RED)
  return "Booking Closed - By Organizer";
} else if (hasEventStarted) {
  // 2. Automatic closure when event starts in IST (ORANGE)
  return "Event Started - Booking Closed";
} else {
  // 3. Normal booking available
  return "Book Now";
}
```

## 📊 Example Scenarios (IST)

### Scenario 1: Event at 6:00 PM IST
- **Database**: `date: "2025-11-25"`, `time: "18:00"` or `"6:00 PM"`
- **Current IST Time**: 5:59 PM → ✅ Booking available
- **Current IST Time**: 6:00 PM → 🔒 Booking closed (automatic)

### Scenario 2: Multi-day Event
- **Start**: Nov 25, 2025 at 10:00 AM IST
- **End**: Nov 27, 2025 at 5:00 PM IST
- **Nov 25, 9:59 AM IST** → ✅ Booking available
- **Nov 25, 10:00 AM IST** → 🔒 Booking closed (event started)
- **Nov 27, 5:01 PM IST** → Event marked as "Past"

### Scenario 3: Admin Manual Closure
- **Event**: Dec 1, 2025 at 3:00 PM IST
- **Current Time**: Nov 28, 2025 (3 days before)
- **Admin enables** "Close Bookings Manually"
- **Result**: 🔴 Booking closed immediately (even though event hasn't started)

## 🔍 Time Parsing Support

The system supports both time formats:

### 12-Hour Format (AM/PM)
- `"9:00 AM"` → 09:00 IST
- `"2:30 PM"` → 14:30 IST
- `"12:00 PM"` → 12:00 IST (noon)
- `"12:00 AM"` → 00:00 IST (midnight)

### 24-Hour Format
- `"09:00"` → 09:00 IST
- `"14:30"` → 14:30 IST
- `"18:45"` → 18:45 IST

## ✨ Key Features

1. **IST Timezone**: All comparisons use `Asia/Kolkata` timezone
2. **Automatic**: No admin intervention needed
3. **Precise**: Closes at exact event start time (not start of day)
4. **Real-time**: Client-side check updates automatically
5. **Flexible**: Admin can override with manual closure

## 🎮 Testing the System

### Test 1: Before Event Starts
1. Create event for tomorrow at 3:00 PM IST
2. Check current IST time (should be before 3:00 PM tomorrow)
3. Visit event page
4. **Expected**: "Book Now" button visible ✅

### Test 2: When Event Starts
1. Create event for today at current time + 2 minutes
2. Wait for event start time
3. Refresh event page
4. **Expected**: "Event Started - Booking Closed" message 🔒

### Test 3: Manual Closure
1. Go to Admin → Events → Edit Event
2. Enable "🚫 Close Bookings Manually"
3. Save event
4. Visit event page
5. **Expected**: "Booking Closed - By Organizer" message 🔴

## 📝 Summary

✅ **System is correctly configured to use IST timezone**
✅ **Bookings close automatically when event starts**
✅ **No UTC timezone used for booking closure**
✅ **Admin manual closure is optional (default: FALSE)**
✅ **Works for both 12-hour and 24-hour time formats**

## 🚀 No Changes Needed

The system is already working exactly as requested:
- Uses IST timezone (not UTC)
- Closes bookings automatically when event starts
- Admin interference is optional
- Default behavior works without admin action

**Everything is ready to use!** 🎉
