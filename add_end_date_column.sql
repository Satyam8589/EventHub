-- Add endDate column to events table
-- This enables proper multi-day event support and expiration filtering

-- Add the endDate column to the events table
ALTER TABLE events 
ADD COLUMN endDate TIMESTAMP WITH TIME ZONE;

-- Add a comment to the column for documentation
COMMENT ON COLUMN events.endDate IS 'Optional ending date for multi-day events. If NULL, event is single-day.';

-- Optional: Add a check constraint to ensure endDate is after start date
-- Uncomment the following line if you want to enforce this constraint:
-- ALTER TABLE events ADD CONSTRAINT check_end_date_after_start_date CHECK (endDate IS NULL OR endDate >= date);