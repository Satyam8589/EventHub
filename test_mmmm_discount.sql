-- Test increment with the correct discount ID

-- 1. Check BEFORE increment
SELECT code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE code = 'MMMM';

-- 2. Run increment function
SELECT increment_discount_usage('c0010d64-8d0a-489c-8c13-ce4a044284e4');

-- 3. Check AFTER increment (should be 1)
SELECT code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE code = 'MMMM';

-- Expected: currentUses should change from 0 to 1
