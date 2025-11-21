# Scan Ticket IST Timezone Fix

## Problem
The scan ticket functionality was working with UTC time internally, which caused issues with the 2-hour scanning window. While the display times were formatted in IST, the actual time comparisons were done in UTC, leading to incorrect behavior.

## Solution
Modified the scan ticket API route to work entirely in IST (Indian Standard Time) timezone for all date/time calculations and comparisons.

## Changes Made

### 1. Date Comparison Logic (Lines 213-221)
**Before:**
```javascript
const currentDate = new Date(); // UTC time
const currentDateOnly = new Date(currentDate);
```

**After:**
```javascript
// Get current date in IST
const nowUTC = new Date();
const nowIST = new Date(nowUTC.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
const currentDateOnly = new Date(nowIST);
```

### 2. Time-Based Validation (Lines 280-300)
**Before:**
```javascript
const now = new Date(); // UTC time
```

**After:**
```javascript
// Get current time in IST
const nowUTC = new Date();
const nowIST = new Date(nowUTC.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
const now = nowIST; // Use IST time for all comparisons
```

## How It Works Now

1. **Current Time in IST**: The system now gets the current UTC time and converts it to IST using `toLocaleString()` with the "Asia/Kolkata" timezone.

2. **Event Day Calculation**: The current event day is calculated based on IST date, not UTC date.

3. **Scanning Window**: The 2-hour window before event start and the event end time are now compared against IST time, ensuring accurate behavior.

## Example Scenario

**Event Details:**
- Event Date: 2025-11-22
- Event Start Time: 10:00 AM IST
- Event End Time: 6:00 PM IST

**Scanning Window (IST):**
- Opens: 8:00 AM IST (2 hours before start)
- Closes: 6:00 PM IST (event end time)

**Before Fix:**
If the server was in UTC, and it was 7:30 AM IST (2:00 AM UTC), the system would incorrectly allow scanning because 2:00 AM UTC is after midnight UTC.

**After Fix:**
At 7:30 AM IST, the system correctly blocks scanning and shows: "Ticket scanning will open at 08:00 AM (2 hours before event start time)."

## Testing
To verify the fix works correctly:
1. Create an event with a specific start time
2. Try scanning a ticket before the 2-hour window
3. Verify the error message shows correct IST times
4. Try scanning during the valid window
5. Try scanning after the event end time

All times displayed and used for validation should now be in IST.
