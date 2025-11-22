-- Find all discount codes in your database

-- 1. Show all discounts
SELECT id, code, "currentUses", "maxUses", "isActive" 
FROM event_discounts 
ORDER BY "createdAt" DESC;

-- 2. Show all bookings with discounts
SELECT 
  b.id as booking_id,
  b."discountId",
  b.status,
  b."totalAmount",
  b."discountAmount",
  b."originalAmount"
FROM bookings b
WHERE b."discountId" IS NOT NULL
ORDER BY b."createdAt" DESC
LIMIT 10;

-- 3. Find the correct discount ID from your bookings
SELECT DISTINCT "discountId" 
FROM bookings 
WHERE "discountId" IS NOT NULL;
