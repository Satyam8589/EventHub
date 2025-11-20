-- Check current push subscriptions
SELECT 
  id,
  user_id,
  endpoint,
  created_at,
  updated_at
FROM push_subscriptions
ORDER BY created_at DESC;

-- Count subscriptions by user_id status
SELECT 
  CASE 
    WHEN user_id IS NULL THEN 'NULL (needs fixing)'
    ELSE 'Has User ID (good)'
  END as status,
  COUNT(*) as count
FROM push_subscriptions
GROUP BY (user_id IS NULL);

-- If you want to see which users have subscriptions
SELECT 
  ps.user_id,
  u.email,
  u.name,
  COUNT(*) as subscription_count,
  MAX(ps.created_at) as last_subscription
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id = u.id
GROUP BY ps.user_id, u.email, u.name
ORDER BY last_subscription DESC;
