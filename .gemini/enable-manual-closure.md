# How to Enable Manual Booking Closure

## 🔧 Step 1: Run Database Migration

You need to add the `booking_closed` column to your database.

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run This SQL**
   ```sql
   ALTER TABLE events 
   ADD COLUMN IF NOT EXISTS booking_closed BOOLEAN DEFAULT FALSE;
   
   COMMENT ON COLUMN events.booking_closed IS 'Manual booking closure flag. When true, prevents new bookings regardless of event timing.';
   ```

4. **Click "Run"**
   - Wait for success message
   - You should see: "Success. No rows returned"

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd c:\Users\satya\Documents\EventHub

# Run the migration
supabase db push
```

## ✅ Step 2: Verify Migration

After running the migration, verify it worked:

1. **Go to Supabase Dashboard**
2. **Click "Table Editor"**
3. **Select "events" table**
4. **Check columns** - you should see:
   - `booking_closed` (boolean, default: false)

## 🎮 Step 3: Test Manual Closure

1. **Go to Admin Panel**
   - Navigate to: `/admin/events`

2. **Edit an Event**
   - Click "Edit" on any event

3. **Find the Toggle**
   - Scroll to "Category and Featured" section
   - You should see: **"🚫 Close Bookings Manually"** checkbox

4. **Enable Manual Closure**
   - Check the box
   - Click "Save"

5. **Verify on Event Page**
   - Visit the event details page
   - Should show: **"Booking Closed - By Organizer"** (Red)

## 🐛 Troubleshooting

### Issue: "Column already exists" error
**Solution**: The column is already added, you're good to go!

### Issue: Toggle doesn't appear in admin
**Possible causes**:
1. Browser cache - Hard refresh (Ctrl + Shift + R)
2. Code not deployed - Restart dev server

### Issue: Toggle appears but doesn't save
**Check**:
1. Open browser console (F12)
2. Look for errors when saving
3. Check if API route is working

### Issue: Manual closure doesn't show on event page
**Check**:
1. Verify `booking_closed` is `true` in database
2. Check browser console for the event data
3. Look for `booking_closed: true` in the event object

## 📝 Quick Test SQL

Run this in Supabase SQL Editor to manually test:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'booking_closed';

-- Manually set booking_closed for a test event
UPDATE events 
SET booking_closed = true 
WHERE id = 'YOUR_EVENT_ID';

-- Check the value
SELECT id, title, booking_closed 
FROM events 
WHERE id = 'YOUR_EVENT_ID';
```

## 🎯 Expected Behavior After Migration

### Before Event Starts
- **Manual closure OFF**: Shows "Book Now" ✅
- **Manual closure ON**: Shows "Booking Closed - By Organizer" 🔴

### After Event Starts
- **Manual closure OFF**: Shows "Event Started - Registration Closed" 🟠
- **Manual closure ON**: Shows "Event Started - Registration Closed" 🟠 (Event started has priority)

## 📞 Still Not Working?

If manual closure still doesn't work after migration:

1. **Check database**:
   ```sql
   SELECT * FROM events WHERE id = 'YOUR_EVENT_ID';
   ```
   Look for `booking_closed` column

2. **Check API response**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Visit event page
   - Look for API call to `/api/events/[id]`
   - Check if response includes `booking_closed` field

3. **Check console logs**:
   - Open browser console
   - Look for any errors
   - Check if event object has `booking_closed` property

## ✨ Summary

1. ✅ Run SQL migration in Supabase
2. ✅ Verify column exists in database
3. ✅ Test toggle in admin panel
4. ✅ Verify on event page

**After running the migration, manual closure will work!** 🎉
