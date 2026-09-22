-- Add latitude and longitude columns to events table if they don't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
