-- Most basic table creation - no constraints at all
CREATE TABLE event_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  user_id TEXT,
  assigned_by TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);