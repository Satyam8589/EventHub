# IST Timezone Fix - Visual Comparison

## Before vs After

### Scenario: Event on Nov 22, 2025 at 10:00 AM IST

```
Event Details:
├── Date: November 22, 2025
├── Start Time: 10:00 AM IST
├── End Time: 6:00 PM IST
└── Scanning Window: 8:00 AM - 6:00 PM IST
```

---

## ❌ BEFORE (Using UTC)

**Server Time: UTC**
**Current Time: 7:30 AM IST (2:00 AM UTC)**

```javascript
const now = new Date(); // 2:00 AM UTC
const eventStartDateTime = new Date("2025-11-22 10:00"); // Interpreted as local/UTC
const earliestScanTime = new Date(eventStartDateTime);
earliestScanTime.setHours(earliestScanTime.getHours() - 2); // 8:00 AM UTC

// Comparison: 2:00 AM UTC < 8:00 AM UTC
// Result: ❌ Blocks scanning (WRONG - should allow at 8 AM IST)
```

**Problem:** The system was comparing UTC times, not IST times!

---

## ✅ AFTER (Using IST)

**Server Time: UTC**
**Current Time: 7:30 AM IST (2:00 AM UTC)**

```javascript
const nowUTC = new Date(); // 2:00 AM UTC
const nowIST = new Date(nowUTC.toLocaleString("en-US", { 
  timeZone: "Asia/Kolkata" 
})); // 7:30 AM IST

const eventStartDateTime = new Date("2025-11-22");
eventStartDateTime.setHours(10, 0, 0, 0); // 10:00 AM IST

const earliestScanTime = new Date(eventStartDateTime);
earliestScanTime.setHours(earliestScanTime.getHours() - 2); // 8:00 AM IST

// Comparison: 7:30 AM IST < 8:00 AM IST
// Result: ✅ Correctly blocks scanning
// Message: "Ticket scanning will open at 08:00 AM"
```

**Solution:** All time calculations now use IST timezone!

---

## Test Cases

### Test Case 1: Before Scanning Window
```
Current Time: 7:30 AM IST
Event Start: 10:00 AM IST
Scanning Opens: 8:00 AM IST

Expected: ❌ Block with message "Scanning opens at 08:00 AM"
Result: ✅ PASS
```

### Test Case 2: During Scanning Window
```
Current Time: 9:00 AM IST
Event Start: 10:00 AM IST
Scanning Opens: 8:00 AM IST
Event Ends: 6:00 PM IST

Expected: ✅ Allow scanning
Result: ✅ PASS
```

### Test Case 3: After Event Ends
```
Current Time: 6:30 PM IST
Event Ends: 6:00 PM IST

Expected: ❌ Block with message "Scanning window closed"
Result: ✅ PASS
```

---

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Date Calculation** | `new Date()` (UTC) | `new Date(nowUTC.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))` |
| **Time Comparison** | UTC vs UTC | IST vs IST |
| **Display Format** | IST (formatting only) | IST (calculation + formatting) |
| **Accuracy** | ❌ Incorrect | ✅ Correct |

---

## Files Modified

1. **`src/app/api/admin/scan-ticket/route.js`**
   - Lines 213-221: Date comparison logic
   - Lines 280-300: Time-based validation

---

## Impact

✅ **Scanning window now works correctly in IST**
✅ **All time comparisons use IST timezone**
✅ **Error messages show accurate IST times**
✅ **No more UTC/IST confusion**
