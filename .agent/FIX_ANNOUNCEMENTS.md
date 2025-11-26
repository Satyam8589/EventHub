# 🔧 Fix Announcements Not Showing - Step by Step Guide

## Problem
You purchased a ticket but the announcements section is showing as "locked" or not accessible.

## Root Cause
The database migration hasn't been applied yet, so the `announcements` column doesn't exist in your `events` table.

## Solution - Follow These Steps:

### Step 1: Apply Database Migration ⚡

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your EventHub project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy the Migration SQL**
   - Open the file: `add_event_announcements.sql`
   - Copy ALL the contents (lines 1-27)

4. **Paste and Execute**
   - Paste the SQL into the Supabase SQL Editor
   - Click the "Run" button (or press Ctrl+Enter)
   - You should see: "Success. No rows returned"

5. **Verify Success**
   - You should see a notice message: "Added announcements column to events table"
   - Or: "announcements column already exists in events table"

### Step 2: Restart Your Development Server 🔄

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Clear Browser Cache 🧹

1. Open your browser's Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

OR

1. Press Ctrl+Shift+Delete
2. Clear "Cached images and files"
3. Click "Clear data"

### Step 4: Test the Feature ✅

1. **Navigate to an event you purchased a ticket for**
   - Go to the event detail page
   - Click on the "Announcements" tab

2. **What you should see:**
   - ✅ If you're the event admin: Form to post announcements
   - ✅ If you purchased a ticket: List of announcements (or "No announcements yet")
   - ❌ If you didn't purchase: Locked state with "Book Ticket to Unlock" button

### Step 5: Debug if Still Not Working 🔍

Run the test script:
```bash
node test-announcements.js
```

This will check:
- ✓ If the announcements column exists
- ✓ If your bookings are properly recorded
- ✓ If the status is "CONFIRMED"

---

## Common Issues & Solutions

### Issue 1: "Column 'announcements' does not exist"
**Solution**: You haven't run the migration yet. Go back to Step 1.

### Issue 2: "Still showing locked even after migration"
**Possible causes**:
1. Browser cache - Clear it (Step 3)
2. Server not restarted - Restart it (Step 2)
3. Booking status is not "CONFIRMED" - Check your database

**Check your booking status**:
```sql
SELECT id, status, userId, eventId 
FROM bookings 
WHERE userId = 'YOUR_USER_ID' 
AND eventId = 'YOUR_EVENT_ID';
```

The status MUST be "CONFIRMED" (not "PENDING" or "CANCELLED")

### Issue 3: "I'm the admin but can't post announcements"
**Check**:
1. Are you logged in?
2. Is your userId matching the event's userId?
3. Or are you listed in the event_admins table?

**Verify admin status**:
```sql
-- Check if you're the event creator
SELECT id, userId, title 
FROM events 
WHERE id = 'YOUR_EVENT_ID';

-- Check if you're an assigned admin
SELECT * 
FROM event_admins 
WHERE eventId = 'YOUR_EVENT_ID' 
AND userId = 'YOUR_USER_ID';
```

---

## Quick Checklist ✓

- [ ] Database migration applied (add_event_announcements.sql)
- [ ] Development server restarted
- [ ] Browser cache cleared
- [ ] Booking status is "CONFIRMED"
- [ ] Logged in with correct user account
- [ ] Viewing the correct event

---

## Still Having Issues?

1. Check browser console for errors (F12 → Console tab)
2. Check server logs for API errors
3. Verify the API route exists: `src/app/api/events/[id]/announcements/route.js`
4. Run the test script: `node test-announcements.js`

## Need More Help?

Share these details:
- Browser console errors (if any)
- Server terminal errors (if any)
- Your booking status from the database
- Whether you're the event admin or a ticket purchaser
