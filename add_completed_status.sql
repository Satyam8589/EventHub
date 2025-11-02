-- Add COMPLETED status to BookingStatus enum
-- Run this SQL in your Supabase SQL Editor

-- First, check current enum values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'bookingstatus');

-- Add COMPLETED to the BookingStatus enum if it doesn't exist
DO $$
BEGIN
    BEGIN
        ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;
END $$;

-- Verify the enum now includes COMPLETED
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'bookingstatus')
ORDER BY enumlabel;

-- Create index for the new status if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_bookings_completed_status ON bookings(status) WHERE status = 'COMPLETED';

-- Test that COMPLETED status works
-- This should not throw an error after the enum is updated
-- UPDATE bookings SET status = 'COMPLETED' WHERE id = 'test-id';