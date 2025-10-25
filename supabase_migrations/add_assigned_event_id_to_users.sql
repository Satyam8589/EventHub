-- Add assigned_event_id column to users table to track which event each admin manages
-- Run this SQL in your Supabase SQL Editor

-- Add the column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS assigned_event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_assigned_event_id ON users(assigned_event_id);

-- Add constraint to ensure only one admin per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_admin_per_event 
ON users(assigned_event_id) 
WHERE assigned_event_id IS NOT NULL AND role = 'EVENT_ADMIN';

-- Add comment
COMMENT ON COLUMN users.assigned_event_id IS 'The event ID that this user is assigned to manage (only for EVENT_ADMIN role)';