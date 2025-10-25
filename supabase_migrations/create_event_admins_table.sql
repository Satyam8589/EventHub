-- Create event_admins table to track which admins are assigned to which events
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS event_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one user can only be assigned to one event
  CONSTRAINT unique_user_per_event UNIQUE(user_id, event_id),
  
  -- Ensure one user can only manage one event total
  CONSTRAINT unique_admin_one_event UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_admins_event_id ON event_admins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_user_id ON event_admins(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE event_admins ENABLE ROW LEVEL SECURITY;

-- Allow super admins to do anything
CREATE POLICY "Super admins can manage event admins" 
  ON event_admins 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Event admins can view their own assignments
CREATE POLICY "Event admins can view their assignments" 
  ON event_admins 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE event_admins IS 'Tracks which users (event admins) are assigned to manage which events. Each admin can only be assigned to one event.';
