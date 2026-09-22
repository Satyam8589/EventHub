-- Enable Row Level Security and add policies for event_discounts table
ALTER TABLE event_discounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read access for active discounts" ON event_discounts;
DROP POLICY IF EXISTS "Allow all access to discounts" ON event_discounts;
DROP POLICY IF EXISTS "Anyone can select discounts" ON event_discounts;
DROP POLICY IF EXISTS "Anyone can insert discounts" ON event_discounts;
DROP POLICY IF EXISTS "Anyone can update discounts" ON event_discounts;
DROP POLICY IF EXISTS "Anyone can delete discounts" ON event_discounts;

-- Allow select for all (frontend can validate discounts)
CREATE POLICY "Anyone can select discounts" ON event_discounts
  FOR SELECT USING (true);

-- Allow insert, update, delete for all (or service role)
CREATE POLICY "Anyone can insert discounts" ON event_discounts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update discounts" ON event_discounts
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete discounts" ON event_discounts
  FOR DELETE USING (true);
