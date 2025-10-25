-- First, let's check what columns exist in events table
-- Run this query first to see your events table structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events';

-- Option 1: If your events table has 'id' as primary key (most common)
CREATE TABLE IF NOT EXISTS event_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Add foreign key constraints AFTER table creation (safer approach)
-- Uncomment the lines below based on your actual table structure:

-- If events table has 'id' column:
-- ALTER TABLE event_admins ADD CONSTRAINT fk_event_admins_event_id 
--   FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- If events table has 'event_id' column:
-- ALTER TABLE event_admins ADD CONSTRAINT fk_event_admins_event_id 
--   FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE;

-- If users table has 'id' column:
-- ALTER TABLE event_admins ADD CONSTRAINT fk_event_admins_user_id 
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_admins_event_id ON event_admins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_user_id ON event_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_assigned_at ON event_admins(assigned_at);

-- Add comments
COMMENT ON TABLE event_admins IS 'Junction table to track which users are assigned as admins for which events';
COMMENT ON COLUMN event_admins.event_id IS 'The event this admin is assigned to manage';
COMMENT ON COLUMN event_admins.user_id IS 'The user who is assigned as admin for this event';
COMMENT ON COLUMN event_admins.assigned_by IS 'The user ID who assigned this admin';