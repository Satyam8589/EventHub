-- Create event_discounts table for managing discount codes
CREATE TABLE IF NOT EXISTS event_discounts (
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_discounts_eventId ON event_discounts("eventId");
CREATE INDEX IF NOT EXISTS idx_event_discounts_code ON event_discounts(code);
CREATE INDEX IF NOT EXISTS idx_event_discounts_isActive ON event_discounts("isActive");

-- Add column to bookings table to track which discount was used
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS "discountId" TEXT REFERENCES event_discounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "originalAmount" DECIMAL(10, 2);

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_event_discounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updatedAt
CREATE TRIGGER event_discounts_updated_at
BEFORE UPDATE ON event_discounts
FOR EACH ROW
EXECUTE FUNCTION update_event_discounts_updated_at();
