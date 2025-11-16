-- Atomic Availability Check Function
-- This function checks ticket availability atomically when creating a PENDING booking
-- Uses row-level locking to prevent race conditions

CREATE OR REPLACE FUNCTION check_ticket_availability(
  p_event_id TEXT,
  p_requested_tickets INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_event RECORD;
  v_total_booked INTEGER;
  v_available_tickets INTEGER;
  v_result JSONB;
BEGIN
  -- Lock the event row to prevent concurrent capacity checks
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;
  
  -- Check if event exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Event not found'
    );
  END IF;
  
  -- Calculate total booked tickets (ONLY CONFIRMED - PENDING bookings don't count)
  -- PENDING bookings are not counted because user might cancel payment
  -- Capacity is only reduced when payment is actually successful (CONFIRMED)
  SELECT COALESCE(SUM(tickets), 0) INTO v_total_booked
  FROM bookings
  WHERE "eventId" = p_event_id
    AND status = 'CONFIRMED'; -- ✅ Only count CONFIRMED bookings
  
  -- Calculate available tickets
  v_available_tickets := v_event.capacity - v_total_booked;
  
  -- Check if there are enough tickets available
  IF v_available_tickets < p_requested_tickets THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not enough tickets available',
      'available_tickets', GREATEST(0, v_available_tickets),
      'requested_tickets', p_requested_tickets,
      'total_capacity', v_event.capacity,
      'total_booked', v_total_booked
    );
  END IF;
  
  -- Tickets are available
  RETURN jsonb_build_object(
    'success', true,
    'available_tickets', v_available_tickets,
    'requested_tickets', p_requested_tickets,
    'total_capacity', v_event.capacity,
    'total_booked', v_total_booked,
    'event', jsonb_build_object(
      'id', v_event.id,
      'title', v_event.title,
      'capacity', v_event.capacity
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_ticket_availability(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ticket_availability(TEXT, INTEGER) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION check_ticket_availability IS 
'Atomically checks ticket availability for an event using row-level locking.
Prevents race conditions when multiple users check availability simultaneously.';

