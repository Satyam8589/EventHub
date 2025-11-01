-- Add scannedQRs column to bookings table
ALTER TABLE bookings 
ADD COLUMN scannedQRs TEXT;