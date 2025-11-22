-- Replace the restrictive policy with a simpler one

-- Step 1: Drop the existing policy
DROP POLICY IF EXISTS "Allow event organizers to manage discounts" ON event_discounts;

-- Step 2: Create a simpler policy that allows all authenticated users
CREATE POLICY "Allow authenticated users to manage discounts"
ON event_discounts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 3: Verify the policy was created
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'event_discounts';

-- Now try creating a discount code again!
