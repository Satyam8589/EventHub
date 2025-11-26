-- Add announcements column to events table
-- This will store event-specific announcements from admins

DO $$ 
BEGIN
    -- Check if announcements column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'announcements'
    ) THEN
        -- Add announcements column as JSONB array to store multiple announcements with timestamps
        ALTER TABLE events 
        ADD COLUMN announcements JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Added announcements column to events table';
    ELSE
        RAISE NOTICE 'announcements column already exists in events table';
    END IF;
END $$;

-- Create an index on announcements for better query performance
CREATE INDEX IF NOT EXISTS idx_events_announcements ON events USING GIN (announcements);

COMMENT ON COLUMN events.announcements IS 'Array of announcement objects with {id, message, createdAt, createdBy} structure';
