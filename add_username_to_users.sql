-- Add username field to users table for reels posting
-- This allows users to have a unique username for posting reels

-- Add username column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add a check constraint to ensure usernames are lowercase and alphanumeric with underscores
-- Drop the constraint first if it exists, then recreate it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'username_format'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT username_format;
    END IF;
END $$;

ALTER TABLE users ADD CONSTRAINT username_format 
  CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');
