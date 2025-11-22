-- The policy already exists! Let's verify it and optionally replace it

-- 1. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'event_discounts';

-- 2. If you want to replace the existing policy, first drop it:
DROP POLICY IF EXISTS "Allow event organizers to manage discounts" ON event_discounts;

-- 3. Then create the simpler version (allows all authenticated users):
CREATE POLICY "Allow authenticated users to manage discounts"
ON event_discounts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Test by trying to create a discount
-- Go to your admin panel and try creating a discount code now!
