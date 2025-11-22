# 🔧 IST Timezone Fix for Multi-Day Event QR Codes

## Problem
You're receiving only 1 QR code for multi-day events because the timezone conversion between UTC (database) and IST (India) is causing the dates to appear as the same day.

## Root Cause
The `calculateEventDays` function in `src/lib/generateTicketImage.js` compares dates in UTC timezone, but events are created and viewed in IST. When a multi-day event spans from 11 PM IST on Day 1 to 1 AM IST on Day 3, the UTC timestamps might fall within 24 hours, making it appear as a single-day event.

## Solution
Replace the `calculateEventDays` function to properly handle IST timezone.

---

## 📝 Code to Replace

### File: `src/lib/generateTicketImage.js`

**Find this function (lines 3-88):**

```javascript
// Helper function to calculate event duration in days
function calculateEventDays(event) {
  console.log("🔍 Calculating event days for:", {
    eventId: event.id,
    eventTitle: event.title,
    date: event.date,
    endDate: event.endDate,
    enddate: event.enddate,
    eventKeys: Object.keys(event),
  });

  const startDate = new Date(event.date);
  const endDateValue = event.endDate || event.enddate;

  console.log("📅 Date parsing:", {
    startDate: startDate.toISOString(),
    endDateValue: endDateValue,
    hasEndDate: !!endDateValue,
  });

  if (!endDateValue) {
    console.log("❌ No end date found, returning 1 day");
    console.log("💡 This explains why event appears as single-day!");
    return 1; // Single day event
  }

  const endDate = new Date(endDateValue);
  const parseTimeToMinutes = (t) => {
    if (!t || typeof t !== "string") return null;
    const s = t.trim();
    const m = s.match(/^([0-1]?\\d|2[0-3]):([0-5]\\d)\\s*(am|pm)?$/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ap = m[3] ? m[3].toLowerCase() : null;
    if (ap) {
      hh = hh % 12 + (ap === "pm" ? 12 : 0);
    }
    return hh * 60 + mm;
  };

  const startMinutes = parseTimeToMinutes(event.time);
  const endMinutes = parseTimeToMinutes(event.endTime || event.endtime);

  if (startMinutes !== null && endMinutes !== null) {
    const startMidnight = new Date(startDate);
    startMidnight.setHours(0, 0, 0, 0);
    const endMidnight = new Date(endDate);
    endMidnight.setHours(0, 0, 0, 0);
    const dayDiff = Math.round((endMidnight - startMidnight) / (24 * 60 * 60 * 1000));
    const totalMinutes = dayDiff * 24 * 60 + (endMinutes - startMinutes);
    if (totalMinutes <= 24 * 60) {
      return 1;
    }
  } else {
    const durationMs = endDate - startDate;
    if (durationMs <= 24 * 60 * 60 * 1000) {
      return 1;
    }
  }

  console.log("📅 Date calculation:", {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    hasEndDate: !!endDate,
  });

  // Use the same logic as TicketModal.js for consistency
  const days = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const finalDays = Math.max(1, days.length);
  console.log("✅ Event duration calculated:", {
    startDate: startDate.toDateString(),
    endDate: endDate.toDateString(),
    daysCount: days.length,
    finalDays,
    calculatedDays: days.map((d) => d.toDateString()),
  });

  return finalDays;
}
```

**Replace with this NEW function:**

```javascript
// Helper function to calculate event duration in days (IST timezone aware)
function calculateEventDays(event) {
  console.log("🔍 Calculating event days for:", {
    eventId: event.id,
    eventTitle: event.title,
    date: event.date,
    endDate: event.endDate,
    enddate: event.enddate,
    eventKeys: Object.keys(event),
  });

  const startDate = new Date(event.date);
  const endDateValue = event.endDate || event.enddate;

  console.log("📅 Date parsing:", {
    startDate: startDate.toISOString(),
    endDateValue: endDateValue,
    hasEndDate: !!endDateValue,
  });

  if (!endDateValue) {
    console.log("❌ No end date found, returning 1 day");
    console.log("💡 This explains why event appears as single-day!");
    return 1; // Single day event
  }

  const endDate = new Date(endDateValue);
  
  // Convert to IST timezone for proper day comparison
  console.log("🕐 Timezone comparison:", {
    startUTC: startDate.toISOString(),
    endUTC: endDate.toISOString(),
    startIST: startDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    endIST: endDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  });

  // Helper function to get date in IST timezone (YYYY-MM-DD format)
  const getISTDateString = (date) => {
    const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return istDate.toISOString().split("T")[0];
  };

  const startDateIST = getISTDateString(startDate);
  const endDateIST = getISTDateString(endDate);

  console.log("📅 IST Date strings for comparison:", {
    startDateIST,
    endDateIST,
    areSameDay: startDateIST === endDateIST,
  });

  // If same day in IST, it's a single-day event
  if (startDateIST === endDateIST) {
    console.log("✅ Same day in IST timezone, returning 1 day");
    return 1;
  }

  console.log("📅 Multi-day event detected in IST");

  // Calculate days between start and end in IST
  const days = [];
  const currentDate = new Date(startDate);
  while (getISTDateString(currentDate) <= endDateIST) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const finalDays = Math.max(1, days.length);
  console.log("✅ Event duration calculated (IST):", {
    startDateIST,
    endDateIST,
    daysCount: days.length,
    finalDays,
    calculatedDaysIST: days.map((d) => getISTDateString(d)),
  });

  return finalDays;
}
```

---

## 🔑 Key Changes

### 1. **IST Timezone Conversion**
```javascript
const getISTDateString = (date) => {
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return istDate.toISOString().split("T")[0];
};
```
This converts UTC dates to IST and extracts just the date part (YYYY-MM-DD).

### 2. **Compare Dates in IST**
```javascript
const startDateIST = getISTDateString(startDate);
const endDateIST = getISTDateString(endDate);

if (startDateIST === endDateIST) {
  return 1; // Same day in IST
}
```
Instead of comparing UTC timestamps, we compare the IST date strings.

### 3. **Calculate Days in IST**
```javascript
while (getISTDateString(currentDate) <= endDateIST) {
  days.push(new Date(currentDate));
  currentDate.setDate(currentDate.getDate() + 1);
}
```
Loop through days using IST date comparison.

---

## 📊 Example

### Before Fix (UTC comparison):
```
Event: Nov 23, 2025 23:00 IST → Nov 25, 2025 01:00 IST
UTC:   Nov 23, 2025 17:30 UTC → Nov 24, 2025 19:30 UTC
Duration: ~26 hours in UTC
Result: 1 QR code (treated as single day due to time check)
```

### After Fix (IST comparison):
```
Event: Nov 23, 2025 23:00 IST → Nov 25, 2025 01:00 IST
IST Dates: 2025-11-23 → 2025-11-25
Days: Nov 23, Nov 24, Nov 25
Result: 3 QR codes (correctly detected as 3-day event)
```

---

## ✅ How to Apply

1. **Open** `src/lib/generateTicketImage.js`
2. **Find** the `calculateEventDays` function (starts around line 3)
3. **Select** the entire function (lines 3-88)
4. **Replace** with the new function code above
5. **Save** the file
6. **Test** with a new booking

---

## 🧪 Testing

After applying the fix:

1. **Complete a test payment** for your multi-day event
2. **Check server logs** - you should see:
   ```
   🕐 Timezone comparison: {
     startIST: '11/23/2025, 11:00:00 PM',
     endIST: '11/25/2025, 1:00:00 AM'
   }
   📅 IST Date strings for comparison: {
     startDateIST: '2025-11-23',
     endDateIST: '2025-11-25',
     areSameDay: false
   }
   📅 Multi-day event detected in IST
   ✅ Event duration calculated (IST): {
     daysCount: 3,
     finalDays: 3,
     calculatedDaysIST: ['2025-11-23', '2025-11-24', '2025-11-25']
   }
   ```

3. **Check your email** - should have 3 QR codes now!

---

## 🎯 Why This Works

The original code had two problems:

1. **UTC-based time duration check** (lines 47-62): Checked if duration was <= 24 hours in UTC, which could be wrong for IST events
2. **UTC-based date loop** (lines 71-76): Looped using UTC dates, not IST dates

The new code:
- ✅ Converts all dates to IST before comparison
- ✅ Compares date strings (YYYY-MM-DD) instead of timestamps
- ✅ Properly detects multi-day events in IST timezone
- ✅ Generates correct number of QR codes

---

## 📝 Summary

**Problem**: Multi-day events showing only 1 QR code  
**Cause**: UTC/IST timezone mismatch in date comparison  
**Solution**: Convert dates to IST before comparing  
**Result**: Correct number of QR codes for multi-day events  

**Status**: Ready to apply! Just copy-paste the new function code.
