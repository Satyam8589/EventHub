-- Fix CASCADE DELETE on event_discounts

-- Step 1: Find the exact constraint name
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'event_discounts'
  AND constraint_type = 'FOREIGN KEY';

-- Step 2: Drop the CASCADE constraint
-- (Replace 'constraint_name' with the actual name from Step 1)
ALTER TABLE event_discounts 
DROP CONSTRAINT IF EXISTS event_discounts_eventid_fkey;

-- Step 3: Add new constraint with NO ACTION (won't delete discounts when event is updated/deleted)
ALTER TABLE event_discounts
ADD CONSTRAINT event_discounts_eventid_fkey
FOREIGN KEY ("eventId") 
REFERENCES events(id)
ON DELETE NO ACTION
ON UPDATE NO ACTION;

-- Step 4: Verify the fix
SELECT
    tc.table_name, 
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'event_discounts'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Expected result: delete_rule = 'NO ACTION'
