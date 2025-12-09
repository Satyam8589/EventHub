-- Add instagram_id field to users table for displaying on profile card
-- This allows users to optionally link their Instagram account

-- Add instagram_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_instagram_id ON users(instagram_id);
