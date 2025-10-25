-- Step 1: Create table without foreign key constraints first
CREATE TABLE IF NOT EXISTS event_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_event_admins_event_id ON event_admins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_user_id ON event_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_event_admins_assigned_at ON event_admins(assigned_at);

-- Step 3: Add foreign key constraints (run these one by one if needed)
-- ALTER TABLE event_admins ADD CONSTRAINT fk_event_admins_event_id 
--   FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- ALTER TABLE event_admins ADD CONSTRAINT fk_event_admins_user_id 
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Add comments
COMMENT ON TABLE event_admins IS 'Junction table to track which users are assigned as admins for which events';
COMMENT ON COLUMN event_admins.event_id IS 'The event this admin is assigned to manage';
COMMENT ON COLUMN event_admins.user_id IS 'The user who is assigned as admin for this event';
COMMENT ON COLUMN event_admins.assigned_by IS 'The user ID who assigned this admin';