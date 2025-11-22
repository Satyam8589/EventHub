-- Debug: Why increment function is not working

-- 1. Check if function exists
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'increment_discount_usage';

-- 2. Try direct UPDATE instead
UPDATE event_discounts
SET "currentUses" = "currentUses" + 1
WHERE id = 'c0010d64-8d0a-489c-8c13-ce4a044284e4';

-- 3. Check if it worked
SELECT code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE code = 'MMMM';

-- 4. If direct UPDATE works, recreate the function
DROP FUNCTION IF EXISTS increment_discount_usage(TEXT);

CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE event_discounts
  SET "currentUses" = "currentUses" + 1
  WHERE id = discount_id;
  
  RAISE NOTICE 'Updated discount % - new currentUses: %', 
    discount_id, 
    (SELECT "currentUses" FROM event_discounts WHERE id = discount_id);
END;
$$ LANGUAGE plpgsql;

-- 5. Test the new function
SELECT increment_discount_usage('c0010d64-8d0a-489c-8c13-ce4a044284e4');

-- 6. Check result
SELECT code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE code = 'MMMM';
