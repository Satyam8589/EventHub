-- Simple Reels Table Creation
-- Copy and paste this into Supabase SQL Editor

-- Create reels table
CREATE TABLE IF NOT EXISTS reels (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type VARCHAR(10) DEFAULT 'image',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read reels
CREATE POLICY "Anyone can view reels" ON reels FOR SELECT USING (true);

-- Allow authenticated users to create reels
CREATE POLICY "Authenticated users can create reels" ON reels FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reels
CREATE POLICY "Users can update their own reels" ON reels FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own reels
CREATE POLICY "Users can delete their own reels" ON reels FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_tags ON reels USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
