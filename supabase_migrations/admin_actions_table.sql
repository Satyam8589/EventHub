-- Create admin_actions table to log all admin actions
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_booking_id ON admin_actions(booking_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- Enable RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view all actions
CREATE POLICY "Super admins can view all admin actions"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::TEXT
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Policy: Admins can insert their own actions
CREATE POLICY "Admins can insert their own actions"
  ON admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = auth.uid()::TEXT
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::TEXT
      AND users.role IN ('SUPER_ADMIN', 'EVENT_ADMIN')
    )
  );
