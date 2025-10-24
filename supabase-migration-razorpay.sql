-- Add Razorpay payment fields to bookings table
-- Run this SQL in your Supabase SQL Editor

-- Add the new columns for Razorpay integration
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS razorpayOrderId TEXT,
ADD COLUMN IF NOT EXISTS paymentVerifiedAt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failureReason TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON bookings(razorpayOrderId);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_verified_at ON bookings(paymentVerifiedAt);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Update existing bookings to have a default status if needed
UPDATE bookings SET status = 'CONFIRMED' WHERE status IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;