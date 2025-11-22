-- Step 1: Check what columns actually exist in the table
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'event_discounts'
ORDER BY ordinal_position;

-- Step 2: Check if table exists at all
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'event_discounts';

-- Step 3: If table exists, view its actual structure
\d event_discounts;

-- Step 4: Check for any existing data
SELECT * FROM event_discounts LIMIT 5;
