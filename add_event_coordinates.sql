-- Add latitude and longitude columns to events table for Google Maps integration
ALTER TABLE events
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comment to explain the columns
COMMENT ON COLUMN events.latitude IS 'Latitude coordinate for Google Maps integration (optional)';
COMMENT ON COLUMN events.longitude IS 'Longitude coordinate for Google Maps integration (optional)';
