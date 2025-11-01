# Gamification Feature - Setup Instructions

## Overview

This gamification feature allows users to review events during their active period (from start date to end date). Events are ranked on a leaderboard based on user reviews and ratings.

## Files Created/Modified

### New Files:

1. **Database Migration:**

   - `supabase_migrations/create_reviews_table.sql` - Creates the reviews table

2. **API Routes:**

   - `src/app/api/reviews/route.js` - CRUD operations for reviews
   - `src/app/api/reviews/stats/route.js` - Review statistics endpoint

3. **Pages:**

   - `src/app/gamification/page.js` - Main leaderboard page with event rankings

4. **Components:**
   - `src/components/EventReviews.js` - Reviews display component for event details

### Modified Files:

1. `src/app/page.js` - Added "Leaderboard" link to navigation
2. `src/app/events/[id]/page.js` - Added "Reviews" tab to event details

## Setup Instructions

### 1. Run Database Migration

You need to create the reviews table in your Supabase database:

**Option A: Using Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase_migrations/create_reviews_table.sql`
4. Paste and run the SQL

**Option B: Using Supabase CLI** (if installed)

```bash
supabase db push
```

### 2. Verify Database Setup

After running the migration, verify that:

- `event_reviews` table is created
- Indexes are created for performance
- Row Level Security (RLS) is enabled
- Policies are created for CRUD operations

### 3. Test the Feature

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Log in to the application

3. Navigate to the "🏆 Leaderboard" page from the navigation menu

4. Find an event that is currently active (between start and end date)

5. Click "Write Review" to add a review

6. Events will be ranked based on:
   - Average rating (primary sort)
   - Number of reviews (secondary sort)

## Features

### Gamification Page (`/gamification`)

- ✅ Events ranked by review ratings
- ✅ Sort by: Top Rated, Most Reviewed, Recent
- ✅ Visual leaderboard with #1, #2, #3 badges
- ✅ Review modal with star rating (1-5)
- ✅ Only allows reviews during event active period
- ✅ Users can edit/delete their own reviews
- ✅ One review per user per event

### Reviews on Event Details

- ✅ New "Reviews" tab on event detail pages
- ✅ Display average rating with star visualization
- ✅ Rating distribution chart
- ✅ List of all reviews with user names and dates
- ✅ Link to full leaderboard

### Review Constraints

- ✅ Reviews only available from event start date to end date
- ✅ Must be logged in to review
- ✅ One review per user per event
- ✅ Rating required (1-5 stars)
- ✅ Review text is optional

## Database Schema

### event_reviews table

```sql
- id (UUID, Primary Key)
- event_id (UUID, Foreign Key to events)
- user_id (TEXT, User identifier)
- user_name (TEXT)
- user_email (TEXT)
- rating (INTEGER, 1-5)
- review_text (TEXT, optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE constraint on (event_id, user_id)
```

## API Endpoints

### GET /api/reviews

Query params:

- `eventId` - Filter by event
- `userId` - Filter by user

### POST /api/reviews

Body:

```json
{
  "eventId": "uuid",
  "userId": "string",
  "userName": "string",
  "userEmail": "string",
  "rating": 1-5,
  "reviewText": "optional"
}
```

### PUT /api/reviews

Body:

```json
{
  "reviewId": "uuid",
  "rating": 1-5,
  "reviewText": "optional"
}
```

### DELETE /api/reviews

Query params:

- `reviewId` - Review to delete

### GET /api/reviews/stats

Query params:

- `eventId` (optional) - Stats for specific event or all events

## Navigation Updates

### Desktop Navigation

Added "🏆 Leaderboard" link (only visible when logged in)

### Mobile Navigation

Added "🏆 Leaderboard" link (only visible when logged in)

## Next Steps (Optional Enhancements)

1. **Email Notifications:**

   - Notify event organizers when they receive reviews
   - Send reminders to attendees to review events

2. **Review Moderation:**

   - Admin panel to moderate/flag inappropriate reviews
   - Auto-filter profanity

3. **Advanced Gamification:**

   - User badges (e.g., "Top Reviewer", "Event Expert")
   - Points system for reviews
   - User leaderboard

4. **Analytics:**

   - Review trends over time
   - Category-based ratings
   - Sentiment analysis

5. **Social Features:**
   - Like/helpful votes on reviews
   - Review replies from organizers
   - Share reviews on social media

## Troubleshooting

### "You have already reviewed this event"

This is expected - users can only submit one review per event. Use "Edit Review" instead.

### "Event hasn't started" or "Event ended"

Reviews are only allowed during the event's active period (start date to end date).

### Reviews not showing

1. Check if the database migration was run successfully
2. Verify RLS policies are enabled
3. Check browser console for API errors

### Leaderboard empty

Make sure there are events with reviews in the database. Try adding some test reviews first.

## Support

If you encounter any issues, check:

1. Browser console for errors
2. Network tab for API responses
3. Supabase logs for database errors
