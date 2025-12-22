# 🔧 DATABASE MIGRATION REQUIRED!

## ⚠️ IMPORTANT: Map Not Showing? Run This Migration!

The map won't show on event pages until you add the `latitude` and `longitude` columns to your database.

---

## 🚀 Quick Fix - 3 Steps

### **Step 1: Go to Supabase Dashboard**

1. Open your browser
2. Go to [https://supabase.com](https://supabase.com)
3. Sign in to your account
4. Select your **EventHub** project

### **Step 2: Open SQL Editor**

1. Click on **SQL Editor** in the left sidebar (icon looks like `</>`)
2. Click **New Query** button

### **Step 3: Run This SQL**

Copy and paste this SQL code:

```sql
-- Add latitude and longitude columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments to explain the columns
COMMENT ON COLUMN events.latitude IS 'Latitude coordinate for Google Maps integration (optional)';
COMMENT ON COLUMN events.longitude IS 'Longitude coordinate for Google Maps integration (optional)';
```

Then click **Run** (or press `Ctrl+Enter`)

---

## ✅ Verify It Worked

You should see a success message like:
```
Success. No rows returned
```

This is normal! It means the columns were added successfully.

---

## 🧪 Test the Feature

### **1. Create a New Event:**
1. Go to `/admin/create-event`
2. Fill in event details
3. Scroll to "Event Location on Map"
4. Search for a location (e.g., "Times Square, New York")
5. Click on a result
6. See the map preview
7. Save the event

### **2. View the Event:**
1. Go to the event detail page
2. Scroll down to the Overview tab
3. **You should now see the map!** 🗺️

---

## 🔍 What This Migration Does

### Before Migration:
```
events table:
- id
- title
- description
- location (text only)
- venue
- ...
❌ No latitude
❌ No longitude
❌ No map display
```

### After Migration:
```
events table:
- id
- title
- description
- location (text)
- latitude (decimal) ✅ NEW!
- longitude (decimal) ✅ NEW!
- venue
- ...
✅ Map can be displayed!
```

---

## 📝 What I Fixed in the Code

### ✅ **API Routes Updated:**

1. **`src/app/api/events/route.js`** (Create Event)
   - Now accepts `latitude` and `longitude` from form
   - Saves them to database

2. **`src/app/api/admin/events/[id]/route.js`** (Edit Event)
   - Now accepts `latitude` and `longitude` from form
   - Updates them in database

3. **`src/app/api/location-search/route.js`** (Search Location)
   - Proxies requests to OpenStreetMap
   - Returns coordinates for search results

### ✅ **Components Updated:**

1. **`src/components/MapLocationPicker.js`**
   - Interactive map search
   - Manual coordinate input
   - Live map preview

2. **`src/components/EventLocationMap.js`**
   - Displays map on event detail page
   - Shows location with marker
   - Links to Google Maps

3. **`src/app/admin/create-event/page.js`**
   - Integrated MapLocationPicker
   - Sends coordinates to API

4. **`src/app/admin/events/[id]/edit/page.js`**
   - Integrated MapLocationPicker
   - Loads existing coordinates
   - Updates coordinates

5. **`src/app/events/[id]/page.js`**
   - Displays EventLocationMap
   - Shows map when coordinates exist

---

## 🎯 Complete Workflow

```
1. Super Admin creates event
   ↓
2. Searches for location: "Central Park, New York"
   ↓
3. Clicks on search result
   ↓
4. Coordinates set: 40.785091, -73.968285
   ↓
5. Map preview shows location
   ↓
6. Saves event
   ↓
7. API stores latitude & longitude in database ✅
   ↓
8. User views event detail page
   ↓
9. Map displays with marker! 🗺️
```

---

## 🛠️ Troubleshooting

### **Map Still Not Showing?**

1. **Check if migration ran:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'events' 
   AND column_name IN ('latitude', 'longitude');
   ```
   
   Should return:
   ```
   latitude  | numeric
   longitude | numeric
   ```

2. **Check if event has coordinates:**
   ```sql
   SELECT id, title, latitude, longitude 
   FROM events 
   WHERE latitude IS NOT NULL;
   ```
   
   Should show events with coordinates.

3. **Create a new event:**
   - Old events won't have coordinates
   - Create a new event with location search
   - Check if the new event shows a map

4. **Check browser console:**
   - Press F12
   - Look for errors in Console tab
   - Share any errors you see

---

## 💡 Important Notes

### **For Existing Events:**
- Old events created before migration won't have coordinates
- You need to **edit them** and add location using the map picker
- Or create new events with the map feature

### **For New Events:**
- All new events can have map locations
- Search is optional - you can skip it
- Manual coordinate input also works

### **Database:**
- Columns are **nullable** (optional)
- Events without coordinates won't show maps
- Events with coordinates will show maps automatically

---

## 📊 Summary

### What You Need to Do:
1. ✅ Run the SQL migration (copy-paste above)
2. ✅ Create a new event with location search
3. ✅ View the event - map should appear!

### What I Already Did:
1. ✅ Created MapLocationPicker component
2. ✅ Created EventLocationMap component
3. ✅ Created location search API
4. ✅ Updated create event form
5. ✅ Updated edit event form
6. ✅ Updated event detail page
7. ✅ Updated create event API
8. ✅ Updated edit event API

---

## 🎉 After Migration

You'll be able to:
- 🔍 Search for locations by name
- 📍 Set coordinates automatically
- 🗺️ See live map preview
- ✏️ Edit locations anytime
- 🚀 Display beautiful maps to users
- 📱 Mobile-friendly map display

---

**Status:** ⚠️ **MIGRATION REQUIRED**

**Run the SQL above in Supabase, then you're all set!** 🚀
