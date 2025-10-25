# Event Admin Assignment Fix

## Problem

Previously, when assigning an event admin to a specific event, they were given access to ALL events. This was because the system only used the user's `role` field (`EVENT_ADMIN`), not a specific event assignment.

## Solution

Created an `event_admins` junction table that tracks which specific users are assigned to which specific events.

## Database Setup Required

### Step 1: Create the event_admins table in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `/supabase_migrations/create_event_admins_table.sql`
4. Click **Run** to execute the SQL

This will create:

- `event_admins` table with foreign keys to `events` and `users`
- Unique constraints to ensure one admin can only be assigned to one event
- Indexes for better performance
- Row Level Security (RLS) policies

### Step 2: Deploy the code changes

The following files have been updated:

- `/src/app/api/admin/events/[id]/admins/route.js` - Now creates entries in `event_admins` table
- `/src/app/api/admin/events/route.js` - Filters events based on `event_admins` assignments for EVENT_ADMIN users

## How It Works Now

### For Super Admin:

1. Go to Admin Dashboard → Events
2. Click on an event → Manage Admins
3. Search for a user and assign them as event admin
4. The system will:
   - Check if user is already assigned to another event (will reject if yes)
   - Create an entry in `event_admins` table linking user to THIS specific event
   - Set user's role to `EVENT_ADMIN` (if not already)

### For Event Admin:

1. When they log in and go to Admin Dashboard
2. They will ONLY see the event they are assigned to
3. They can manage bookings, scan tickets, etc. for THEIR event only

## Key Features

✅ One admin per event (enforced by database constraint)
✅ One event per admin (enforced by database constraint)  
✅ Super admins can reassign admins by removing old assignment first
✅ Event admins only see their assigned event
✅ Proper error messages when trying to assign already-assigned admins

## Testing

1. Create a test user
2. Assign them as admin to Event A
3. Try to assign them to Event B → Should fail with error message
4. Log in as that user → Should only see Event A in admin panel
