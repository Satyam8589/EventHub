-- FIXED: RLS Policy with correct type casting

-- Allow event organizers to create/manage discounts for their events
CREATE POLICY "Allow event organizers to manage discounts"
ON event_discounts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_discounts."eventId"
    AND events."organizerId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_discounts."eventId"
    AND events."organizerId" = auth.uid()::text
  )
);

-- OR if you want a simpler policy (allow all authenticated users):
-- CREATE POLICY "Allow authenticated users to manage discounts"
-- ON event_discounts
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);
