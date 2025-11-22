-- Test the increment function and check results

-- 1. Check current value BEFORE increment
SELECT id, code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE id = 'c0010d64-8d0a-489c-8c13-ce4a044284e4';

-- 2. Test the increment function
SELECT increment_discount_usage('c0010d64-8d0a-489c-8c13-ce4a044284e4');

-- 3. Check current value AFTER increment (should be +1)
SELECT id, code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE id = 'c0010d64-8d0a-489c-8c13-ce4a044284e4';

-- 4. If you need to manually set it to 1 (for the past confirmed booking):
-- UPDATE event_discounts
-- SET "currentUses" = 1
-- WHERE id = 'c0010d64-8d0a-489c-8c13-ce4a044284e4';
