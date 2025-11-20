-- OPTIONAL: Clean up old subscriptions with NULL user_id
-- Run this ONLY after confirming the fix works with new subscriptions

-- First, check how many NULL entries exist
SELECT COUNT(*) as null_user_id_count
FROM push_subscriptions
WHERE user_id IS NULL;

-- Then delete them (uncomment when ready)
-- DELETE FROM push_subscriptions WHERE user_id IS NULL;

-- Verify deletion
-- SELECT COUNT(*) as remaining_null_count
-- FROM push_subscriptions
-- WHERE user_id IS NULL;
