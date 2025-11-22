-- Create the increment_discount_usage function

CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE event_discounts
  SET "currentUses" = "currentUses" + 1,
      "updatedAt" = NOW()
  WHERE id = discount_id;
END;
$$ LANGUAGE plpgsql;

-- Test it immediately
SELECT increment_discount_usage('c0010d64-8d0a-489c-8c13-ce4a044284e4');

-- Check if it worked
SELECT id, code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE id = 'c0010d64-8d0a-489c-8c13-ce4a044284e4';

-- Expected: currentUses should be 1 now
