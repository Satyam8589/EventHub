# EventCard Badge Display Configuration

## Summary of Changes

Updated the EventCard component to control status badge visibility based on the page context.

---

## Changes Made

### 1. **EventCard Component** (`src/components/EventCard.js`)

#### Added `showStatusBadge` Prop:
```javascript
export default function EventCard({ event, showStatusBadge = true }) {
```

- **Default value:** `true` (for backward compatibility)
- **Purpose:** Controls whether status badges (UPCOMING/ONGOING/PAST) are displayed

#### Updated Status Badge Logic:
```javascript
// Status badge configuration - Only show if NOT featured AND showStatusBadge is true
const statusBadge = showStatusBadge && !event.featured && isOngoing
  ? { text: "ONGOING", classes: "from-green-500 to-emerald-600 border-green-300/50" }
  : showStatusBadge && !event.featured && isUpcoming
  ? { text: "UPCOMING", classes: "from-blue-500 to-cyan-600 border-blue-300/50" }
  : showStatusBadge && !event.featured && isPast
  ? { text: "PAST", classes: "from-gray-500 to-gray-600 border-gray-300/50" }
  : null;
```

**Conditions for showing status badge:**
1. ✅ `showStatusBadge` prop is `true`
2. ✅ Event is NOT featured
3. ✅ Event matches one of the status conditions (upcoming/ongoing/past)

---

### 2. **Home Page** (`src/app/page.js`)

#### Updated EventCard Usage:
```javascript
<EventCard
  event={{
    ...event,
    registered: event._count?.bookings || 0,
    isExpired: false,
  }}
  showStatusBadge={false}  // ← Added this
/>
```

**Result:** Status badges are **hidden** on the home page

---

## Badge Display Rules

### Home Page (`/`)
| Event Type | Mobile | Desktop |
|------------|--------|---------|
| **Featured** | ⭐ (star only) | ⭐ (star only) |
| **Non-Featured Upcoming** | *(no badge)* | *(no badge)* |
| **Non-Featured Ongoing** | *(no badge)* | *(no badge)* |
| **Non-Featured Past** | *(no badge)* | *(no badge)* |

### Other Pages (`/events`, `/my-events`, `/admin/events`, etc.)
| Event Type | Mobile | Desktop |
|------------|--------|---------|
| **Featured** | ⭐ (star only) | ⭐ (star only) |
| **Non-Featured Upcoming** | UPCOMING (small) | UPCOMING (small) |
| **Non-Featured Ongoing** | ONGOING (small) | ONGOING (small) |
| **Non-Featured Past** | PAST (small) | PAST (small) |

---

## Pages Affected

### ✅ Status Badges HIDDEN:
- **Home Page** (`/`) - `showStatusBadge={false}`

### ✅ Status Badges SHOWN (default behavior):
- **Events Page** (`/events`)
- **My Events Page** (`/my-events`)
- **Admin Events Page** (`/admin/events`)
- **Admin Create Event Preview** (`/admin/create-event`)

All other pages use the default `showStatusBadge={true}` behavior.

---

## Visual Examples

### Home Page - Mobile View:
```
Featured Event:        Non-Featured Event:
┌─────────────┐       ┌─────────────┐
│         ⭐  │       │             │ ← No badge
│   [Image]   │       │   [Image]   │
│   Title     │       │   Title     │
└─────────────┘       └─────────────┘
```

### Events Page - Mobile View:
```
Featured Event:        Non-Featured Upcoming:
┌─────────────┐       ┌─────────────┐
│         ⭐  │       │    UPCOMING │ ← Badge shown
│   [Image]   │       │   [Image]   │
│   Title     │       │   Title     │
└─────────────┘       └─────────────┘
```

---

## Implementation Details

### Featured Badge Behavior (Unchanged):
- **Mobile:** Shows only star icon ⭐
- **Desktop:** Shows full badge "⭐ FEATURED"
- **Always visible** regardless of `showStatusBadge` prop

### Status Badge Behavior (Updated):
- **Controlled by:** `showStatusBadge` prop
- **Only shows when:** Event is NOT featured
- **Types:** UPCOMING (blue), ONGOING (green), PAST (gray)

---

## Code Logic Flow

```
EventCard receives showStatusBadge prop
    ↓
Check if showStatusBadge === true
    ↓
    ├─ YES → Check if event is featured
    │         ↓
    │         ├─ YES → statusBadge = null (featured events don't show status)
    │         └─ NO → Check event status (upcoming/ongoing/past)
    │                  ↓
    │                  └─ Show appropriate status badge
    │
    └─ NO → statusBadge = null (hidden on home page)
```

---

## Benefits

✅ **Cleaner Home Page:** No status badges cluttering the UI
✅ **Featured Events Stand Out:** Only the golden star is visible
✅ **Detailed Event Pages:** Full status information available where needed
✅ **Backward Compatible:** Default behavior unchanged for existing pages
✅ **Flexible:** Easy to control badge visibility per page

---

## Testing Checklist

- [x] Home page shows no status badges
- [x] Home page shows featured star for featured events
- [x] Events page shows status badges for non-featured events
- [x] My Events page shows status badges
- [x] Admin pages show status badges
- [x] Featured events never show status badges (any page)
- [x] Mobile view shows star-only for featured events
- [x] Desktop view shows full "FEATURED" badge

---

**Status: ✅ COMPLETE**

Status badges are now hidden on the home page while remaining visible on all other pages!
