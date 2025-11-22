-- Check all existing policies and their details

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'event_discounts';

-- If the policy exists but still not working, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'event_discounts';

-- Try creating a discount manually to test
INSERT INTO event_discounts (
  id,
  "eventId",
  code,
  type,
  value,
  "maxUses",
  "currentUses",
  "isActive",
  "validUntil",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'f1df2377-7fe3-43e7-9d36-23ad9d758b78',  -- Your event ID
  'TEST123',
  'PERCENTAGE',
  10,
  100,
  0,
  true,
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
);

-- Check if it was created
SELECT * FROM event_discounts WHERE code = 'TEST123';
