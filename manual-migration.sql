-- Manual migration script to move scanned ticket data from paymentId to scannedqrs
-- Run this in Supabase SQL editor

-- First, let's see the current state
SELECT 
  id,
  "userId",
  "paymentId",
  scannedqrs
FROM bookings 
WHERE "paymentId" LIKE 'SCANNED_TICKETS_%'
ORDER BY "createdAt" DESC;

-- Migration query to move scanned ticket data
UPDATE bookings 
SET 
  scannedqrs = CAST(REPLACE("paymentId", 'SCANNED_TICKETS_', '') AS jsonb),
  "paymentId" = NULL
WHERE "paymentId" LIKE 'SCANNED_TICKETS_%';

-- Verify the migration
SELECT 
  id,
  "userId",
  "paymentId",
  scannedqrs
FROM bookings 
WHERE scannedqrs IS NOT NULL
ORDER BY "createdAt" DESC;