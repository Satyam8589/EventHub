-- Add assignedEventId column to users table
-- This is much simpler than creating a junction table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS assignedEventId TEXT;