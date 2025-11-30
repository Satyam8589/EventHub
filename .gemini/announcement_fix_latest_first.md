# Announcement Section Fixes

## Issues Fixed

### 1. Latest Announcements Not Showing First
The announcement section was displaying announcements in chronological order (oldest first), but the requirement was to show the latest announcements at the top.

### 2. Super Admin Cannot Post Announcements
Super admins were unable to post announcements to events because the API was only checking if the user was the event creator or an assigned event admin, not checking for SUPER_ADMIN role.

## Changes Made

### Fix 1: Latest Announcements First
**File**: `src/app/api/events/[id]/announcements/route.js`

**Change**: Modified line 115 to prepend new announcements instead of appending them.

**Before**:
```javascript
const updatedAnnouncements = [...existingAnnouncements, newAnnouncement];
```

**After**:
```javascript
const updatedAnnouncements = [newAnnouncement, ...existingAnnouncements];
```

### Fix 2: Super Admin Authorization
**File**: `src/app/api/events/[id]/announcements/route.js`

**Changes**: Added super admin role check in both POST and DELETE endpoints.

**Added to POST endpoint** (after line 86):
```javascript
// Check if user is a super admin
const { data: userData } = await supabase
  .from("users")
  .select("role")
  .eq("id", userId)
  .single();

const isSuperAdmin = userData?.role === "SUPER_ADMIN";
```

**Updated authorization check**:
```javascript
// Before
if (!isCreator && !isAdmin) {
  return NextResponse.json(
    { error: "Unauthorized. Only event admins can post announcements." },
    { status: 403 }
  );
}

// After
if (!isCreator && !isAdmin && !isSuperAdmin) {
  return NextResponse.json(
    { error: "Unauthorized. Only event admins can post announcements." },
    { status: 403 }
  );
}
```

**Same changes applied to DELETE endpoint** for consistency.

**Impact**: 
- When a super admin or event admin posts a new announcement, it will now appear at the **top** of the announcements list
- All existing announcements will be pushed down
- This applies to both the admin events page and the public event detail page
- **Super admins can now post and delete announcements on ANY event**
- Event creators can post and delete announcements on their own events
- Assigned event admins can post and delete announcements on events they're assigned to

## Authorization Hierarchy

The announcement system now supports three levels of authorization:

1. **Super Admin (SUPER_ADMIN role)**
   - Can post announcements to ANY event
   - Can delete announcements from ANY event
   - No need to be the event creator or assigned admin

2. **Event Creator**
   - Can post announcements to their own events
   - Can delete announcements from their own events

3. **Assigned Event Admin**
   - Can post announcements to events they're assigned to
   - Can delete announcements from events they're assigned to

## How It Works

### For Super Admin & Event Admin
1. Navigate to **Admin Dashboard** → **Events**
2. Click the **"📢 Announcements"** button on any event card
3. Post a new announcement in the modal
4. The new announcement will appear at the **top** of the list

### For Ticket Holders (Public Event Page)
1. Navigate to any event detail page
2. Click the **"Announcements"** tab
3. View announcements in reverse chronological order (latest first)

## Display Order
- **Latest announcement** → Top of the list
- **Older announcements** → Below, in descending order
- **Oldest announcement** → Bottom of the list

## Testing
To verify the fix:
1. Post a new announcement from the admin panel
2. Check that it appears at the top of the announcements list
3. Post another announcement
4. Verify the second announcement appears above the first one
5. Check both the admin modal and the public event page

## Files Modified
- `src/app/api/events/[id]/announcements/route.js` - API route for posting announcements

## Files That Display Announcements (No changes needed)
- `src/app/admin/events/page.js` - Admin events page with announcements modal
- `src/app/events/[id]/page.js` - Public event detail page with announcements tab

Both pages will automatically display announcements in the correct order since they fetch from the API.
