-- Check if discount exists and is accessible

-- 1. Check if discount exists (as admin/postgres)
SELECT 
  id,
  "eventId",
  code,
  type,
  value,
  "maxUses",
  "currentUses",
  "isActive",
  "validUntil",
  "createdAt"
FROM event_discounts
WHERE "eventId" = 'f1df2377-7fe3-43e7-9d36-23ad9d758b78'
ORDER BY "createdAt" DESC;

-- 2. Check RLS policies for SELECT
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'event_discounts'
  AND cmd = 'SELECT';

-- 3. If no SELECT policy exists, create one
CREATE POLICY "Allow public to read active discounts"
ON event_discounts
FOR SELECT
TO public
USING ("isActive" = true);

-- OR allow all reads:
-- CREATE POLICY "Allow all to read discounts"
-- ON event_discounts
-- FOR SELECT
-- TO public
-- USING (true);

-- 4. Test the query that the API uses
SELECT *
FROM event_discounts
WHERE "eventId" = 'f1df2377-7fe3-43e7-9d36-23ad9d758b78'
  AND code = 'MMMM'  -- Replace with your actual code
  AND "isActive" = true;
