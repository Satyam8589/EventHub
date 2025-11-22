-- Test if increment_discount_usage function exists and works

-- 1. Check if function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'increment_discount_usage';

-- 2. Test the function manually with one of your discount IDs
-- Replace 'YOUR_DISCOUNT_ID' with actual ID from the screenshot
SELECT increment_discount_usage('72cfd039-1cf2-4e68-851a-a9bdae6d866b');

-- 3. Check the result
SELECT id, code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE id = '72cfd039-1cf2-4e68-851a-a9bdae6d866b';

-- 4. Check if discountId is stored in bookings
SELECT 
  b.id,
  b."discountId",
  b."totalAmount",
  b."discountAmount",
  b."originalAmount",
  b.status,
  b."createdAt"
FROM bookings b
WHERE b."discountId" IS NOT NULL
ORDER BY b."createdAt" DESC
LIMIT 5;
