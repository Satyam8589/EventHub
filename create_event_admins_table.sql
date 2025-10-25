-- Create a simple event_admins table to track which admins are assigned to which events
-- This is a lightweight junction table that doesn't modify existing users table

CREATE TABLE IF NOT EXISTS event_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- Ensure one admin per event and prevent duplicate assignments
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_admins_event_id ON event_admins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_user_id ON event_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_assigned_at ON event_admins(assigned_at);

-- Add comments
COMMENT ON TABLE event_admins IS 'Junction table to track which users are assigned as admins for which events';
COMMENT ON COLUMN event_admins.event_id IS 'The event this admin is assigned to manage';
COMMENT ON COLUMN event_admins.user_id IS 'The user who is assigned as admin for this event';
COMMENT ON COLUMN event_admins.assigned_by IS 'The user ID who assigned this admin';