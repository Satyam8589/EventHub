-- Create reviews table for event gamification
CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one review per user per event
  UNIQUE(event_id, user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_reviews_event_id ON event_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_user_id ON event_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_rating ON event_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_event_reviews_created_at ON event_reviews(created_at DESC);

-- Enable Row Level Security
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can view reviews" ON event_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON event_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own reviews" ON event_reviews
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own reviews" ON event_reviews
  FOR DELETE USING (true);
