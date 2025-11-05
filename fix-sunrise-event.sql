-- Fix for "Sunrise to Sunset Music Fest" event end date
-- Run this in Supabase SQL editor to fix the Gmail ticket issue

-- First, check the current event data
SELECT 
  id,
  title,
  date,
  "endDate",
  enddate
FROM events 
WHERE title ILIKE '%Sunrise to Sunset%'
ORDER BY created_at DESC;

-- Update the event to have proper end date (making it a 2-day event)
-- Based on scanned QR data, this should be a 2-day event
UPDATE events 
SET 
  "endDate" = DATE(date) + INTERVAL '1 day'
WHERE title ILIKE '%Sunrise to Sunset%'
  AND ("endDate" IS NULL AND enddate IS NULL);

-- Verify the update
SELECT 
  id,
  title,
  date,
  "endDate",
  enddate,
  DATE(date) + INTERVAL '1 day' as calculated_end_date
FROM events 
WHERE title ILIKE '%Sunrise to Sunset%'
ORDER BY created_at DESC;