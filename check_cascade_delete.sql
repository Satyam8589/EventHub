-- Check if there's a CASCADE DELETE on event_discounts

-- 1. Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'event_discounts'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. If there's a CASCADE DELETE, we need to change it to NO ACTION or RESTRICT
-- First, find the constraint name from the query above
-- Then run something like:
-- ALTER TABLE event_discounts 
-- DROP CONSTRAINT constraint_name_here;
--
-- ALTER TABLE event_discounts
-- ADD CONSTRAINT event_discounts_eventid_fkey
-- FOREIGN KEY ("eventId") 
-- REFERENCES events(id)
-- ON DELETE NO ACTION;  -- or RESTRICT

-- 3. Check if discounts still exist after event update
SELECT id, code, "eventId", "isActive" 
FROM event_discounts 
WHERE "eventId" = 'f1df2377-7fe3-43e7-9d36-23ad9d758b78'
ORDER BY "createdAt" DESC;
