-- Fix: Disable RLS or use service role

-- Option 1: Check if RLS is enabled on event_discounts
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'event_discounts';

-- Option 2: Temporarily disable RLS to test
ALTER TABLE event_discounts DISABLE ROW LEVEL SECURITY;

-- Now try the UPDATE again
UPDATE event_discounts
SET "currentUses" = "currentUses" + 1
WHERE id = 'c0010d64-8d0a-489c-8c13-ce4a044284e4';

-- Check result
SELECT code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE code = 'MMMM';

-- If it works now, re-enable RLS
ALTER TABLE event_discounts ENABLE ROW LEVEL SECURITY;

-- Option 3: Create a policy that allows updates
CREATE POLICY "Allow increment_discount_usage function" 
ON event_discounts 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Option 4: Use service role key in the function
-- The function should be created with SECURITY DEFINER
DROP FUNCTION IF EXISTS increment_discount_usage(TEXT);

CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id TEXT)
RETURNS void 
SECURITY DEFINER  -- This makes it run with creator's permissions
SET search_path = public
AS $$
BEGIN
  UPDATE event_discounts
  SET "currentUses" = "currentUses" + 1
  WHERE id = discount_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_discount_usage(TEXT) TO anon, authenticated;

-- Test it
SELECT increment_discount_usage('c0010d64-8d0a-489c-8c13-ce4a044284e4');

-- Check result
SELECT code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE code = 'MMMM';
