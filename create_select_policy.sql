-- Create SELECT policy for event_discounts

-- Allow public to read all discounts
CREATE POLICY "Allow all to read discounts"
ON event_discounts
FOR SELECT
TO public
USING (true);

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'event_discounts'
ORDER BY cmd, policyname;

-- Test reading the discount
SELECT id, code, type, value, "isActive"
FROM event_discounts
WHERE "eventId" = 'f1df2377-7fe3-43e7-9d36-23ad9d758b78'
  AND code = 'HA';
