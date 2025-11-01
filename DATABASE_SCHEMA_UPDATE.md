# Database Schema Update Required

## Issue

The `endDate` column is missing from the `events` table in the Supabase database.

## Error Message

```
Could not find the 'endDate' column of 'events' in the schema cache
```

## Solution

Add the `endDate` column to the events table in Supabase.

### SQL Command to Run in Supabase SQL Editor:

```sql
-- Add endDate column to events table
ALTER TABLE events
ADD COLUMN endDate TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN events.endDate IS 'Optional end date for multi-day events';

-- Create index for better performance on date range queries
CREATE INDEX idx_events_enddate ON events(endDate) WHERE endDate IS NOT NULL;
```

### Steps to Execute:

1. **Open Supabase Dashboard**

   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the SQL Command**

   - Copy the SQL command above
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Change**
   - Go to Table Editor
   - Select the `events` table
   - Confirm that `endDate` column is now present

### After Adding the Column:

1. **Remove Temporary Fixes**

   - The API routes now have fallback logic to handle missing endDate column
   - Once the column is added, this fallback won't be needed
   - The endDate functionality will work fully

2. **Test the Feature**
   - Create/edit events with end dates
   - Verify endDate is stored and displayed correctly
   - Check that expired events are filtered properly

### Column Details:

- **Type**: `TIMESTAMP WITH TIME ZONE` (matches the `date` column)
- **Nullable**: `YES` (optional field)
- **Default**: `NULL`
- **Purpose**: Store end date for multi-day events

This will enable full endDate functionality across the application.
