-- Payment Verification Tracking and Idempotency
-- This migration adds tables and columns to track payment verification attempts
-- and ensure idempotent processing

-- Add columns to bookings table for better tracking
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS webhook_processed_at TIMESTAMPTZ;

-- Create payment_verification_log table to track all verification attempts
CREATE TABLE IF NOT EXISTS payment_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL,
  razorpay_payment_id TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  verification_source TEXT NOT NULL, -- 'client', 'webhook', 'polling'
  success BOOLEAN NOT NULL,
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint separately
ALTER TABLE payment_verification_log
ADD CONSTRAINT payment_verification_log_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_verification_log_booking_id 
  ON payment_verification_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_verification_log_payment_id 
  ON payment_verification_log(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_verification_log_created_at 
  ON payment_verification_log(created_at DESC);

-- Create webhook_events table to track all webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  booking_id TEXT,
  payload JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_error TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Add foreign key constraint for webhook_events
ALTER TABLE webhook_events
ADD CONSTRAINT webhook_events_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- Create indexes for webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id 
  ON webhook_events(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id 
  ON webhook_events(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at 
  ON webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed 
  ON webhook_events(processed) WHERE NOT processed;

-- Function to log verification attempts
CREATE OR REPLACE FUNCTION log_verification_attempt(
  p_booking_id TEXT,
  p_payment_id TEXT,
  p_order_id TEXT,
  p_attempt_number INTEGER,
  p_source TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert verification log entry
  INSERT INTO payment_verification_log (
    booking_id,
    razorpay_payment_id,
    razorpay_order_id,
    attempt_number,
    verification_source,
    success,
    error_message,
    response_time_ms
  ) VALUES (
    p_booking_id,
    p_payment_id,
    p_order_id,
    p_attempt_number,
    p_source,
    p_success,
    p_error_message,
    p_response_time_ms
  );
  
  -- Update booking verification tracking
  UPDATE bookings
  SET 
    verification_attempts = COALESCE(verification_attempts, 0) + 1,
    last_verification_attempt = NOW()
  WHERE id = p_booking_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION log_verification_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION log_verification_attempt TO anon;

-- Add comments
COMMENT ON TABLE payment_verification_log IS 
'Tracks all payment verification attempts for debugging and monitoring';

COMMENT ON TABLE webhook_events IS 
'Stores all webhook events received from Razorpay for audit trail';

COMMENT ON FUNCTION log_verification_attempt IS 
'Logs a payment verification attempt with details for monitoring';
