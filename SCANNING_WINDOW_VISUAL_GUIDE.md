## 🎫 Scanning Time Window - Visual Guide

### 📊 How It Works

```
Event Timeline for November 21, 2025
Event: 6:00 PM to 10:00 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

12:00 AM │ ❌ BLOCKED
         │ "Scanning not yet available"
         │
         │ [Too Early - Before Window]
         │
04:00 PM ┃═══════════════════════════════════════════════════════════════════════
         ┃ ✅ SCANNING WINDOW OPENS
         ┃ (2 hours before event start)
         ┃
         ┃ [Valid Scanning Period]
         ┃
06:00 PM ┃───────────────────────────────────────────────────────────────────────
         ┃ 🎉 EVENT STARTS
         ┃
         ┃ [Event In Progress - Still Valid]
         ┃
10:00 PM ┃═══════════════════════════════════════════════════════════════════════
         ┃ 🏁 EVENT ENDS / SCANNING WINDOW CLOSES
         │
         │ [Too Late - After Window]
         │
11:59 PM │ ❌ BLOCKED
         │ "Scanning window closed"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Legend:
═══ Scanning Window (ALLOWED)
─── Event Duration
│   Outside Window (BLOCKED)
```

### 🕐 Time-Based Validation Flow

```
Admin Attempts to Scan Ticket
         │
         ▼
┌────────────────────────┐
│ Is it the event day?   │
└────────┬───────────────┘
         │
         ├─ NO ──► ❌ "Event not started yet"
         │
         ├─ YES
         │
         ▼
┌────────────────────────────────────────┐
│ Is current time >= 2 hours before      │
│ event start time?                      │
└────────┬───────────────────────────────┘
         │
         ├─ NO ──► ❌ "Scanning not yet available"
         │         "Will open at 04:00 PM"
         │
         ├─ YES
         │
         ▼
┌────────────────────────────────────────┐
│ Is current time <= event end time?     │
└────────┬───────────────────────────────┘
         │
         ├─ NO ──► ❌ "Scanning window closed"
         │         "Event ended at 10:00 PM"
         │
         ├─ YES
         │
         ▼
┌────────────────────────────────────────┐
│ Has ticket already been scanned?       │
└────────┬───────────────────────────────┘
         │
         ├─ YES ──► ❌ "Already verified"
         │
         ├─ NO
         │
         ▼
    ✅ SUCCESS
    Ticket Scanned!
```

### 📅 Multi-Day Event Example

```
3-Day Conference: Nov 25-27, 2025
Daily Schedule: 5:00 PM - 11:00 PM

Day 1 (Nov 25)                Day 2 (Nov 26)                Day 3 (Nov 27)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

03:00 PM ┃═══════════════┃    03:00 PM ┃═══════════════┃    03:00 PM ┃═══════════════┃
         ┃ Window Opens  ┃             ┃ Window Opens  ┃             ┃ Window Opens  ┃
         ┃ (Day 1 only)  ┃             ┃ (Day 2 only)  ┃             ┃ (Day 3 only)  ┃
         ┃               ┃             ┃               ┃             ┃               ┃
05:00 PM ┃───────────────┃    05:00 PM ┃───────────────┃    05:00 PM ┃───────────────┃
         ┃ Event Starts  ┃             ┃ Event Starts  ┃             ┃ Event Starts  ┃
         ┃               ┃             ┃               ┃             ┃               ┃
11:00 PM ┃═══════════════┃    11:00 PM ┃═══════════════┃    11:00 PM ┃═══════════════┃
         ┃ Window Closes ┃             ┃ Window Closes ┃             ┃ Window Closes ┃

Note: Each day has its own independent scanning window
      Day 1 ticket can only be scanned on Day 1 within its window
      Day 2 ticket can only be scanned on Day 2 within its window
      Day 3 ticket can only be scanned on Day 3 within its window
```

### ⏰ Real-Time Examples

#### Example 1: Admin tries at 2:00 PM (Event at 6:00 PM)
```
Current Time: 02:00 PM
Event Time: 06:00 PM - 10:00 PM
Window Opens: 04:00 PM

Status: ❌ BLOCKED
Reason: Too Early
Message: "Scanning will open at 04:00 PM (2 hours before event start time)"
Wait Time: 2 hours
```

#### Example 2: Admin tries at 5:00 PM (Event at 6:00 PM)
```
Current Time: 05:00 PM
Event Time: 06:00 PM - 10:00 PM
Window: 04:00 PM - 10:00 PM

Status: ✅ ALLOWED
Reason: Within scanning window (1 hour after opening)
Action: Proceed with ticket verification
```

#### Example 3: Admin tries at 7:30 PM (Event at 6:00 PM)
```
Current Time: 07:30 PM
Event Time: 06:00 PM - 10:00 PM
Window: 04:00 PM - 10:00 PM

Status: ✅ ALLOWED
Reason: Event in progress, within window
Action: Proceed with ticket verification
```

#### Example 4: Admin tries at 10:30 PM (Event ended at 10:00 PM)
```
Current Time: 10:30 PM
Event Time: 06:00 PM - 10:00 PM
Window Closed: 10:00 PM

Status: ❌ BLOCKED
Reason: Too Late
Message: "Scanning window closed. Event ended at 10:00 PM"
Elapsed: 30 minutes ago
```

### 🎯 Quick Reference Table

| Time | Event: 6PM-10PM | Status | Reason |
|------|----------------|--------|---------|
| 2:00 PM | Before window | ❌ BLOCKED | Opens at 4:00 PM |
| 3:59 PM | 1 min before | ❌ BLOCKED | Opens at 4:00 PM |
| 4:00 PM | Window opens | ✅ ALLOWED | Exactly at opening |
| 5:00 PM | Before event | ✅ ALLOWED | Within window |
| 6:00 PM | Event starts | ✅ ALLOWED | Event in progress |
| 8:00 PM | During event | ✅ ALLOWED | Event in progress |
| 10:00 PM | Event ends | ✅ ALLOWED | Exactly at closing |
| 10:01 PM | 1 min after | ❌ BLOCKED | Window closed |
| 11:00 PM | After window | ❌ BLOCKED | Ended at 10:00 PM |

### 🔑 Key Points

✅ **Window Opens**: Event Start Time - 2 hours  
✅ **Window Closes**: Event End Time  
✅ **Duration**: Typically 2 hours + event duration  
✅ **Multi-Day**: Each day has independent window  
✅ **Edge Cases**: Exact times (opening/closing) are ALLOWED  

❌ **Blocked Before**: Window opening time  
❌ **Blocked After**: Event end time  
❌ **Wrong Day**: Multi-day events enforce correct day  

### 📱 What Admin Sees

```
┌─────────────────────────────────────────┐
│  🎫 Ticket Scanner                      │
├─────────────────────────────────────────┤
│                                         │
│  Event: Tech Conference 2025            │
│  Date: November 21, 2025                │
│  Time: 6:00 PM - 10:00 PM               │
│                                         │
│  ⏰ Scanning Window:                    │
│     Opens: 4:00 PM                      │
│     Closes: 10:00 PM                    │
│                                         │
│  🕐 Current Time: 5:30 PM               │
│  ✅ Status: Window Open                 │
│                                         │
│  [Scan QR Code] [Manual Entry]         │
│                                         │
└─────────────────────────────────────────┘
```

### 🎉 Success Flow

```
1. Admin opens scanner page
2. System checks current time
3. Validates against scanning window
4. Shows window status (Open/Closed)
5. Admin scans ticket
6. System validates:
   ✓ Correct event day
   ✓ Within time window
   ✓ Not already scanned
7. ✅ Success: Ticket verified!
```

---

**This visual guide shows exactly how the scanning time window works in practice!**
