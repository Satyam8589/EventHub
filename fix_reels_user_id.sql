-- Fix reels table user_id column to work with Firebase auth IDs
-- Step 1: Drop all policies that depend on user_id
DROP POLICY IF EXISTS "Anyone can view reels" ON reels;
DROP POLICY IF EXISTS "Authenticated users can create reels" ON reels;
DROP POLICY IF EXISTS "Users can update their own reels" ON reels;
DROP POLICY IF EXISTS "Users can delete their own reels" ON reels;

-- Step 2: Drop the foreign key constraint
ALTER TABLE reels DROP CONSTRAINT IF EXISTS reels_user_id_fkey;

-- Step 3: Change user_id column type from UUID to TEXT
ALTER TABLE reels ALTER COLUMN user_id TYPE TEXT;

-- Step 4: Recreate the policies with TEXT type
CREATE POLICY "Anyone can view reels" ON reels FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reels" ON reels FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own reels" ON reels FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete their own reels" ON reels FOR DELETE USING (auth.uid()::text = user_id);
