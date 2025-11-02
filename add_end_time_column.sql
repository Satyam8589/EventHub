-- Add endTime column to events table if it doesn't exist
-- This will add support for storing event ending time

-- Check if the column exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'endtime'
    ) THEN
        -- Add the endTime column to the events table
        ALTER TABLE events ADD COLUMN endtime TIME;
        
        -- Add a comment to explain the column
        COMMENT ON COLUMN events.endtime IS 'Event ending time (optional)';
        
        RAISE NOTICE 'Added endtime column to events table';
    ELSE
        RAISE NOTICE 'endtime column already exists in events table';
    END IF;
END $$;