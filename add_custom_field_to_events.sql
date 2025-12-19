-- Add custom field settings to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_custom_field BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_field_label TEXT DEFAULT 'Additional Information';

-- Add custom field response to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS custom_field_response TEXT;

-- Add comments
COMMENT ON COLUMN events.show_custom_field IS 'Controls whether custom input field is shown in booking popup';
COMMENT ON COLUMN events.custom_field_label IS 'Label for the custom input field in booking popup';
COMMENT ON COLUMN bookings.custom_field_response IS 'User response to custom field during booking';
