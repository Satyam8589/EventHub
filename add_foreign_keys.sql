-- Add foreign key constraints to event_admins table
-- This will fix the relationship issues

ALTER TABLE event_admins 
ADD CONSTRAINT fk_event_admins_event_id 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_admins 
ADD CONSTRAINT fk_event_admins_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;