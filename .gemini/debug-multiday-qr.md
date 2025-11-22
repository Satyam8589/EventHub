# 🔍 Debugging: Why Only 1 QR Code for Multi-Day Events

## The Issue
You're receiving only 1 QR code in your email ticket even though your event spans multiple days.

## Root Cause Analysis

### How Multi-Day Detection Works

The ticket generator determines if an event is multi-day by checking:

```javascript
// In generateTicketImage.js - calculateEventDays()
const endDateValue = event.endDate || event.enddate;

if (!endDateValue) {
  return 1; // Single day event
}

const endDate = new Date(endDateValue);
const startDate = new Date(event.date);

// Calculate days between start and end
// If > 1 day, generate multiple QR codes
```

### Possible Reasons for Single QR Code

1. **Missing `endDate` field** - Event doesn't have an end date set
2. **Same day event** - `endDate` equals `date` (same day)
3. **Database column name mismatch** - Using wrong field name
4. **Data not fetched** - Complete event data fetch failed

## 🧪 Diagnostic Steps

### Step 1: Check Server Logs

After completing a payment, look for these log messages:

```
✅ Complete event data fetched successfully!
📋 Event fields: {
  id: '...',
  title: '...',
  date: '2025-11-23T...',
  endDate: '2025-11-25T...',  ← Should be present for multi-day
  enddate: null,
  ...
}

🗓️ Multi-day check: {
  hasEndDate: true,  ← Should be true
  endDateValue: '2025-11-25T...',  ← Should be different from date
  isMultiDay: true  ← Should be true for multi-day events
}

🔍 Calculating event days for: {
  eventId: '...',
  eventTitle: '...',
  date: '2025-11-23T...',
  endDate: '2025-11-25T...',  ← Should be present
  ...
}

✅ Event duration calculated: {
  startDate: 'Sat Nov 23 2025',
  endDate: 'Mon Nov 25 2025',
  daysCount: 3,  ← Should be > 1 for multi-day
  finalDays: 3,
  calculatedDays: ['Sat Nov 23 2025', 'Sun Nov 24 2025', 'Mon Nov 25 2025']
}
```

### Step 2: Check Event in Database

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id,
  title,
  date,
  "endDate",  -- Note: camelCase with quotes
  time,
  "endTime"
FROM events
WHERE id = 'YOUR_EVENT_ID';
```

**What to look for:**
- ✅ `endDate` should be present and NOT NULL
- ✅ `endDate` should be AFTER `date`
- ✅ Both should be in ISO format (e.g., '2025-11-23T10:00:00Z')

### Step 3: Check Event Creation

When creating/editing the event in admin panel:

1. Go to Admin → Events → Edit Event
2. Check if "End Date" field is filled
3. Verify "End Date" is AFTER "Start Date"
4. Save and check database again

## 🔧 Common Fixes

### Fix 1: Event Missing End Date

**Problem**: Event was created without an end date

**Solution**:
1. Go to Admin → Events
2. Edit your multi-day event
3. Set the "End Date" field
4. Save the event
5. Try booking again

### Fix 2: Database Column Name Issue

**Problem**: Database uses different column name

**Check**: Look at the logs for `allKeys` field:
```javascript
allKeys: ['id', 'title', 'date', 'endDate', 'time', ...]
```

If you see `enddate` (lowercase) instead of `endDate`, the code already handles this:
```javascript
const endDateValue = event.endDate || event.enddate;
```

### Fix 3: Data Fetch Failed

**Problem**: Complete event data fetch failed

**Check logs for**:
```
❌ Failed to fetch complete event details: [error]
⚠️ Using partial event data for ticket generation
```

**Solution**: Check Supabase connection and permissions

## 🎯 Expected Behavior

### For Single-Day Event:
```
Event: Nov 23, 2025 (no end date)
Result: 1 large QR code
```

### For Multi-Day Event (3 days):
```
Event: Nov 23 - Nov 25, 2025
Result: 3 QR codes in grid layout
  - Day 1: Nov 23
  - Day 2: Nov 24  
  - Day 3: Nov 25
```

## 📊 Quick Test

### Create a Test Multi-Day Event:

1. **Go to Admin → Create Event**
2. **Set dates:**
   - Start Date: Tomorrow
   - End Date: 3 days from tomorrow
3. **Save and book a ticket**
4. **Check email** - should have 3 QR codes

## 🔍 What to Send Me for Help

If it's still not working, send me:

1. **Server logs** from payment verification (look for the emoji logs above)
2. **Event data** from database query
3. **Screenshot** of event edit page showing dates
4. **Email ticket** screenshot showing the QR code section

## 💡 Most Likely Issue

Based on common scenarios, the most likely issue is:

**The event doesn't have an `endDate` set in the database**

### Quick Fix:
1. Edit the event in admin panel
2. Set the End Date field
3. Save
4. Test with a new booking

---

## 🧪 Test Script

You can also test the calculation directly. Add this to your event edit page temporarily:

```javascript
// Test multi-day calculation
const testEvent = {
  date: '2025-11-23T10:00:00Z',
  endDate: '2025-11-25T18:00:00Z',
  time: '10:00',
  endTime: '18:00'
};

const startDate = new Date(testEvent.date);
const endDate = new Date(testEvent.endDate);
const days = [];
const currentDate = new Date(startDate);

while (currentDate <= endDate) {
  days.push(new Date(currentDate));
  currentDate.setDate(currentDate.getDate() + 1);
}

console.log('Days:', days.length); // Should be 3
console.log('Dates:', days.map(d => d.toDateString()));
```

Expected output:
```
Days: 3
Dates: ['Sat Nov 23 2025', 'Sun Nov 24 2025', 'Mon Nov 25 2025']
```

---

## ✅ Verification Checklist

After fixing:

- [ ] Event has `endDate` in database
- [ ] `endDate` > `date` (end is after start)
- [ ] Server logs show `isMultiDay: true`
- [ ] Server logs show `daysCount: X` (where X > 1)
- [ ] Email ticket has X QR codes (one per day)
- [ ] Each QR code labeled "Day 1", "Day 2", etc.
- [ ] Each QR code shows the date for that day

**Status**: Ready for debugging! Check the logs after your next test payment.
