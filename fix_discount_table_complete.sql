-- ============================================
-- COMPLETE FIX: Drop and Recreate event_discounts Table
-- ============================================

-- Step 1: Drop existing table and all dependencies
DROP TABLE IF EXISTS event_discounts CASCADE;

-- Step 2: Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_event_discounts_updated_at() CASCADE;

-- Step 3: Drop the increment function if it exists
DROP FUNCTION IF EXISTS increment_discount_usage(TEXT) CASCADE;

-- Step 4: Remove columns from bookings table if they exist
ALTER TABLE bookings DROP COLUMN IF EXISTS "discountId";
ALTER TABLE bookings DROP COLUMN IF EXISTS "discountAmount";
ALTER TABLE bookings DROP COLUMN IF EXISTS "originalAmount";

-- ============================================
-- Now recreate everything from scratch
-- ============================================

-- Step 5: Create event_discounts table with correct structure
CREATE TABLE event_discounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "eventId" TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
  value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
  "maxUses" INTEGER,
  "currentUses" INTEGER DEFAULT 0,
  "validUntil" TIMESTAMP WITH TIME ZONE,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("eventId", code)
);

-- Step 6: Create indexes
CREATE INDEX idx_event_discounts_eventId ON event_discounts("eventId");
CREATE INDEX idx_event_discounts_code ON event_discounts(code);
CREATE INDEX idx_event_discounts_isActive ON event_discounts("isActive");

-- Step 7: Add columns to bookings table
ALTER TABLE bookings 
ADD COLUMN "discountId" TEXT REFERENCES event_discounts(id) ON DELETE SET NULL,
ADD COLUMN "discountAmount" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN "originalAmount" DECIMAL(10, 2);

-- Step 8: Create trigger function for updatedAt
CREATE OR REPLACE FUNCTION update_event_discounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger
CREATE TRIGGER event_discounts_updated_at
BEFORE UPDATE ON event_discounts
FOR EACH ROW
EXECUTE FUNCTION update_event_discounts_updated_at();

-- Step 10: Create increment usage function
CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE event_discounts
  SET "currentUses" = "currentUses" + 1
  WHERE id = discount_id;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 12: Verify table structure
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'event_discounts'
ORDER BY ordinal_position;

-- Success message
SELECT 'event_discounts table created successfully!' as status;
