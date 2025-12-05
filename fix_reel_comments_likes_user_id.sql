-- Fix reel_comments and reel_likes tables to use TEXT for user_id (Firebase compatibility)

-- 1. Fix reel_comments table
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view all comments" ON reel_comments;
DROP POLICY IF EXISTS "Users can create comments" ON reel_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON reel_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON reel_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON reel_comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON reel_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON reel_comments;

-- Drop foreign key constraint if exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reel_comments_user_id_fkey'
    ) THEN
        ALTER TABLE reel_comments DROP CONSTRAINT reel_comments_user_id_fkey;
    END IF;
END $$;

-- Alter user_id column type
ALTER TABLE reel_comments ALTER COLUMN user_id TYPE TEXT;

-- Recreate RLS policies with TEXT casting
ALTER TABLE reel_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments"
  ON reel_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON reel_comments FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own comments"
  ON reel_comments FOR DELETE
  USING (auth.uid()::text = user_id);

-- 2. Fix reel_likes table
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view all likes" ON reel_likes;
DROP POLICY IF EXISTS "Users can manage own likes" ON reel_likes;
DROP POLICY IF EXISTS "Users can unlike" ON reel_likes;
DROP POLICY IF EXISTS "Users can like" ON reel_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON reel_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON reel_likes;
DROP POLICY IF EXISTS "Users can update own likes" ON reel_likes;

-- Drop foreign key constraint if exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reel_likes_user_id_fkey'
    ) THEN
        ALTER TABLE reel_likes DROP CONSTRAINT reel_likes_user_id_fkey;
    END IF;
END $$;

-- Alter user_id column type
ALTER TABLE reel_likes ALTER COLUMN user_id TYPE TEXT;

-- Recreate RLS policies with TEXT casting
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON reel_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON reel_likes FOR ALL
  USING (auth.uid()::text = user_id);
