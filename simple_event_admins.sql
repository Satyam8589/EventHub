-- Create event_admins junction table (simple version)
-- This tracks which users are assigned as admins for specific events

CREATE TABLE IF NOT EXISTS event_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_admins_event_id ON event_admins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_user_id ON event_admins(user_id);