-- Add booking_closed column to events table
-- This allows admins to manually close bookings regardless of event start time

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS booking_closed BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN events.booking_closed IS 'Manual booking closure flag. When true, prevents new bookings regardless of event timing.';
