-- Atomic Booking Confirmation Function
-- This function ensures that only one booking can be confirmed at a time
-- and prevents overselling by checking availability within a transaction

CREATE OR REPLACE FUNCTION confirm_booking_with_availability_check(
  p_booking_id UUID,
  p_payment_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking RECORD;
  v_event RECORD;
  v_total_booked INTEGER;
  v_available_tickets INTEGER;
  v_result JSONB;
BEGIN
  -- Lock the booking row to prevent concurrent updates
  SELECT * INTO v_booking
  FROM bookings
  WHERE id::text = p_booking_id::text
  FOR UPDATE;
  
  -- Check if booking exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;
  
  -- Check if booking is already confirmed
  IF v_booking.status = 'CONFIRMED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking already confirmed',
      'booking', row_to_json(v_booking)
    );
  END IF;
  
  -- Check if booking is in PENDING state
  IF v_booking.status != 'PENDING' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking is not in pending state',
      'current_status', v_booking.status
    );
  END IF;
  
  -- Lock the event row to prevent concurrent capacity checks
  SELECT * INTO v_event
  FROM events
  WHERE id::text = v_booking."eventId"::text
  FOR UPDATE;
  
  -- Check if event exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Event not found'
    );
  END IF;
  
  -- Calculate total booked tickets (CONFIRMED only)
  -- We count CONFIRMED bookings + this PENDING booking we're trying to confirm
  -- This ensures we check availability at confirmation time (when payment succeeds)
  SELECT COALESCE(SUM(tickets), 0) INTO v_total_booked
  FROM bookings
  WHERE "eventId"::text = v_booking."eventId"::text
    AND status = 'CONFIRMED';
  
  -- Add this booking's tickets to the total (since it's currently PENDING)
  v_total_booked := v_total_booked + v_booking.tickets;
  
  -- Calculate available tickets after confirming this booking
  v_available_tickets := v_event.capacity - v_total_booked;
  
  -- Check if there are enough tickets available
  -- If total (CONFIRMED + this booking) exceeds capacity, we cannot confirm
  -- This prevents overselling - only first payment to succeed gets the ticket
  IF v_total_booked > v_event.capacity OR v_available_tickets < 0 THEN
    -- Mark this booking as failed due to overselling
    UPDATE bookings
    SET 
      status = 'FAILED',
      "failureReason" = 'Not enough tickets available - overselling prevented',
      "updatedAt" = NOW()
    WHERE id = p_booking_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not enough tickets available',
      'available_tickets', GREATEST(0, v_available_tickets),
      'requested_tickets', v_booking.tickets,
      'total_capacity', v_event.capacity,
      'total_booked', v_total_booked
    );
  END IF;
  
  -- If we reach here, tickets are available - confirm the booking
  -- Store the Razorpay transaction ID (payment ID) in paymentId field
  UPDATE bookings
  SET 
    status = 'CONFIRMED',
    "paymentId" = p_payment_id,
    "updatedAt" = NOW()
  WHERE id::text = p_booking_id::text
  RETURNING * INTO v_booking;
  
  -- Return success with booking details
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Booking confirmed successfully',
    'booking', row_to_json(v_booking),
    'event', jsonb_build_object(
      'id', v_event.id,
      'title', v_event.title,
      'date', v_event.date,
      'time', v_event.time,
      'location', v_event.location,
      'capacity', v_event.capacity,
      'available_tickets', GREATEST(0, v_event.capacity - v_total_booked)
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback is automatic in function
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_booking_with_availability_check(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_booking_with_availability_check(UUID, TEXT) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION confirm_booking_with_availability_check IS 
'Atomically confirms a booking after checking ticket availability. 
Uses row-level locking to prevent race conditions and overselling.
Returns JSONB with success status and booking details.';

