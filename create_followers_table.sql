-- Create followers table for user follow/unfollow functionality
CREATE TABLE IF NOT EXISTS followers (
  id SERIAL PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't follow the same person twice
  UNIQUE(follower_id, following_id),
  
  -- Ensure a user can't follow themselves
  CHECK (follower_id != following_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON followers(created_at);

-- Enable Row Level Security
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Note: RLS with Firebase Auth UIDs requires custom implementation)
-- For now, we'll use permissive policies and handle authorization in the API layer
CREATE POLICY "Anyone can view followers" ON followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON followers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unfollow" ON followers FOR DELETE USING (true);

-- Add comments
COMMENT ON TABLE followers IS 'Stores user follow relationships';
COMMENT ON COLUMN followers.follower_id IS 'User who is following';
COMMENT ON COLUMN followers.following_id IS 'User being followed';
