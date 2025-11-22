-- Create function to increment discount usage atomically
CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE event_discounts
  SET "currentUses" = "currentUses" + 1
  WHERE id = discount_id;
END;
$$ LANGUAGE plpgsql;
