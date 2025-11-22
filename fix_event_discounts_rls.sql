-- Fix RLS policy for event_discounts table

-- Option 1: Create a policy to allow INSERT for authenticated users
CREATE POLICY "Allow authenticated users to insert discounts"
ON event_discounts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Option 2: Create a policy to allow all operations for authenticated users
CREATE POLICY "Allow authenticated users full access to discounts"
ON event_discounts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Option 3: If you want to restrict to specific users (e.g., event organizers)
-- First, check if the user is the organizer of the event
CREATE POLICY "Allow event organizers to manage discounts"
ON event_discounts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_discounts."eventId"
    AND events."organizerId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_discounts."eventId"
    AND events."organizerId" = auth.uid()::text
  )
);

-- Option 4: Temporarily disable RLS to test (NOT recommended for production)
-- ALTER TABLE event_discounts DISABLE ROW LEVEL SECURITY;

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'event_discounts';

-- If you want to drop all existing policies and start fresh:
-- DROP POLICY IF EXISTS "policy_name_here" ON event_discounts;
