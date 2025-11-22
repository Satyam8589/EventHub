-- Create a trigger to auto-increment discount usage when booking is confirmed

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION auto_increment_discount_on_confirm()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment if:
  -- 1. Status changed to CONFIRMED
  -- 2. There is a discountId
  -- 3. paymentId is not PENDING
  IF NEW.status = 'CONFIRMED' 
     AND OLD.status != 'CONFIRMED' 
     AND NEW."discountId" IS NOT NULL
     AND NEW."paymentId" NOT LIKE 'PENDING_%' THEN
    
    -- Increment the discount usage
    UPDATE event_discounts
    SET "currentUses" = "currentUses" + 1,
        "updatedAt" = NOW()
    WHERE id = NEW."discountId";
    
    RAISE NOTICE 'Auto-incremented discount usage for discountId: %', NEW."discountId";
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS trigger_increment_discount_on_confirm ON bookings;

CREATE TRIGGER trigger_increment_discount_on_confirm
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION auto_increment_discount_on_confirm();

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION auto_increment_discount_on_confirm() TO anon, authenticated;

-- Step 4: Test it by updating a booking to CONFIRMED
-- First, let's see current state
SELECT 
  b.id,
  b.status,
  b."paymentId",
  b."discountId",
  d.code,
  d."currentUses"
FROM bookings b
LEFT JOIN event_discounts d ON b."discountId" = d.id
WHERE b."discountId" IS NOT NULL
ORDER BY b."createdAt" DESC
LIMIT 5;

-- Now manually update a PENDING booking to CONFIRMED to test
-- (Replace with actual booking ID from above query)
-- UPDATE bookings
-- SET status = 'CONFIRMED',
--     "paymentId" = 'test_payment_123'
-- WHERE id = 'YOUR_BOOKING_ID_HERE';

-- Check if currentUses increased
SELECT code, "currentUses", "maxUses" 
FROM event_discounts 
WHERE code = 'MMMM';
