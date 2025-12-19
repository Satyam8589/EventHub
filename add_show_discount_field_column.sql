-- Add show_discount_field column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_discount_field BOOLEAN DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN events.show_discount_field IS 'Controls whether discount code field is shown in booking popup';
