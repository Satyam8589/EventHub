-- Check the last booking with discount to see what values are stored

SELECT 
  id,
  "totalAmount",
  "discountAmount",
  "originalAmount",
  "discountId",
  "createdAt"
FROM bookings
WHERE "discountId" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 5;

-- This will show you the actual values stored in the database
-- Compare them with what you expect:
-- totalAmount should be: final price after discount
-- discountAmount should be: the discount value
-- originalAmount should be: price before discount
