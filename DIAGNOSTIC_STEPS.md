# 🔍 IMMEDIATE DIAGNOSTIC STEPS - 3 Events But Only 1 Shows

## Current Situation

- ✅ Database has 3 events (you confirmed)
- ✅ Health endpoint works but shows old code (eventCount: 1)
- ❌ Only 1 event showing on frontend

## Step 1: Deploy Latest Changes

You MUST deploy first to get updated endpoints:

```bash
git add .
git commit -m "Add test endpoint and enhanced logging"
git push origin main
```

Wait for deployment to complete (usually 2-5 minutes).

## Step 2: Test New Endpoints (After Deploy)

### A. Test Direct Events Query

```
https://your-site.com/api/events/test
```

**Expected Result:**

```json
{
  "success": true,
  "totalEvents": 3,
  "events": [
    { "id": "...", "title": "Event 1", ... },
    { "id": "...", "title": "Event 2", ... },
    { "id": "...", "title": "Event 3", ... }
  ]
}
```

**If shows 3 events:** Problem is in bookings query or Promise.all
**If shows 1 event:** Database query issue or filtering

### B. Test Updated Health Endpoint

```
https://your-site.com/api/health
```

**Expected Result:**

```json
{
  "status": "healthy",
  "totalEventsInDB": 3,
  "allEvents": [...]
}
```

**If still shows old format:** Deployment cache not cleared

### C. Test Main Events API

```
https://your-site.com/api/events
```

**Check response for:**

- How many events in array?
- Any error messages?

## Step 3: Check Deployment Logs

In your deployment platform (Vercel/Netlify):

1. Go to latest deployment
2. Find function logs for `/api/events`
3. Look for these log messages:
   ```
   Raw events from database: X
   Events details: [...]
   Successfully fetched events: Y
   ```

**Key Questions:**

- What is X (raw events count)?
- What is Y (final events count)?
- If X = 3 but Y = 1, issue is in bookings processing

## Step 4: Check Deployment Cache

### Vercel:

```bash
# Redeploy to clear cache
vercel --prod --force
```

### Netlify:

1. Go to Deploys
2. Click "Trigger deploy"
3. Select "Clear cache and deploy site"

### Other platforms:

Look for "Clear cache" or "Force rebuild" option

## Most Likely Issues & Quick Fixes

### Issue 1: Deployment Using Old Code

**Symptoms:** Health endpoint still shows old format
**Fix:**

```bash
# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push origin main
```

### Issue 2: Bookings Query Failing Silently

**Symptoms:** /api/events/test shows 3, but /api/events shows 1
**Fix:** Check if bookings table exists and has correct permissions

### Issue 3: Promise.all Breaking on Error

**Symptoms:** One event has bad data causing others to fail
**Fix:** Add try-catch around each booking query (I'll do this next)

### Issue 4: Frontend Not Refreshing

**Symptoms:** API returns 3 events but page shows 1
**Fix:** Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

## Quick Test Commands

```bash
# Test all endpoints at once
curl https://your-site.com/api/health
curl https://your-site.com/api/events/test
curl https://your-site.com/api/events

# Check if deployment is latest
curl https://your-site.com/api/health | grep totalEventsInDB
# Should show "totalEventsInDB": 3
```

## What To Report Back

After deploying and testing, share:

1. ✅ Output from `/api/events/test`
2. ✅ Output from updated `/api/health`
3. ✅ Output from `/api/events`
4. ✅ Any error messages from deployment logs
5. ✅ Screenshot of browser console on home page

## Emergency Fix

If still broken after all above, add this temporary workaround:

In `src/app/api/events/route.js`, replace the Promise.all section with:

```javascript
// Simplified version without bookings
const eventsWithCounts = events.map((event) => ({
  ...event,
  _count: { bookings: 0 },
}));
```

This will show all events (without booking counts) to confirm the issue is in bookings processing.
