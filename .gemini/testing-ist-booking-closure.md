# Testing Event Booking Closure - IST Timezone

## 🔧 Fix Applied

Fixed the IST timezone calculation to properly handle UTC dates from the database. The system now correctly:
1. Parses UTC date from database
2. Converts to IST date
3. Combines with event time
4. Compares with current IST time

## 🧪 How to Test

### Test 1: Create Event Starting Soon

1. **Create a test event:**
   - Date: Today's date
   - Time: Current IST time + 5 minutes
   - Example: If now is 9:35 PM IST, set time to 9:40 PM

2. **Before event starts (9:35 PM - 9:39 PM):**
   - Visit event page
   - **Expected**: "Book Now" button visible ✅
   - Check browser console for debug log

3. **When event starts (9:40 PM):**
   - Refresh the page
   - **Expected**: "Event Started - Booking Closed" message 🔒
   - Check browser console for debug log

### Test 2: Check Console Logs

Open browser console (F12) and look for:

```javascript
🕐 Event Start Check (IST): {
  eventTitle: "Your Event Name",
  eventDateFromDB: "2025-11-24T00:00:00.000Z",  // UTC from database
  eventTime: "21:40",  // or "9:40 PM"
  eventStartIST: "25/11/2025, 9:40:00 pm",  // Converted to IST
  nowIST: "25/11/2025, 9:35:00 pm",  // Current IST time
  hasEventStarted: false  // or true if event started
}
```

### Test 3: Verify IST Conversion

**Example Event:**
- Database date: `2025-11-24T00:00:00.000Z` (UTC midnight)
- Event time: `18:00` (6:00 PM)
- Expected IST: Nov 24, 2025 at 6:00 PM IST

**Check:**
1. Console log shows correct IST date
2. Booking closes at exactly 6:00 PM IST (not UTC)

### Test 4: Different Time Formats

Test with both formats:

**12-hour format:**
- `9:00 AM`
- `2:30 PM`
- `12:00 PM` (noon)
- `12:00 AM` (midnight)

**24-hour format:**
- `09:00`
- `14:30`
- `18:45`

## 🐛 Debug Information

The system now logs detailed information to help debug:

```javascript
console.log('🕐 Event Start Check (IST):', {
  eventTitle: event.title,
  eventDateFromDB: event.date,
  eventTime: event.time,
  eventStartIST: eventStartIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  nowIST: nowIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  hasEventStarted
});
```

## ✅ Expected Behavior

### Scenario 1: Event Tomorrow at 3:00 PM IST
- **Now**: Nov 24, 2025 at 9:40 PM IST
- **Event**: Nov 25, 2025 at 3:00 PM IST
- **Result**: ✅ Booking available (event hasn't started)

### Scenario 2: Event Today at 9:00 PM IST
- **Now**: Nov 24, 2025 at 9:40 PM IST
- **Event**: Nov 24, 2025 at 9:00 PM IST
- **Result**: 🔒 Booking closed (event started 40 minutes ago)

### Scenario 3: Event Today at 10:00 PM IST
- **Now**: Nov 24, 2025 at 9:40 PM IST
- **Event**: Nov 24, 2025 at 10:00 PM IST
- **Result**: ✅ Booking available (event starts in 20 minutes)

## 🔍 What Changed

### Before (Incorrect):
```javascript
const eventDate = new Date(event.date);  // Creates date in local timezone
const eventDateIST = new Date(eventDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
// This caused timezone confusion
```

### After (Correct):
```javascript
// 1. Parse UTC date from database
const eventDateUTC = new Date(event.date);

// 2. Convert to IST date string
const eventDateISTString = eventDateUTC.toLocaleString("en-US", { 
  timeZone: "Asia/Kolkata",
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

// 3. Parse IST date components
const [month, day, year] = eventDateISTString.split('/').map(num => parseInt(num));

// 4. Create IST datetime with event time
const eventStartIST = new Date(year, month - 1, day, hours, minutes, 0);

// 5. Compare with current IST time
hasEventStarted = nowIST >= eventStartIST;
```

## 📝 Quick Test Script

Run this in browser console on event page:

```javascript
// Get current IST time
const now = new Date();
const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
console.log('Current IST Time:', istTime);

// This should match the console log from the page
```

## ✨ Summary

- ✅ Fixed UTC to IST conversion
- ✅ Added debug logging
- ✅ Proper date/time parsing
- ✅ Accurate comparison
- ✅ Works with both time formats

**The booking closure should now work correctly with IST timezone!**
