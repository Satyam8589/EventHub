# 🔥 QUICK FIX GUIDE - Events Not Showing in Deployment

## 📋 30-Second Checklist

Visit these URLs in order and note results:

1. **Health Check** → `https://your-site.com/api/health`
   - ✅ Should return `"status": "healthy"`
   - ❌ If not, check environment variables

2. **Events API** → `https://your-site.com/api/events`
   - ✅ Should return `{"events": [...]}`
   - ❌ If empty `[]`, add events in admin panel
   - ❌ If error, check database connection

3. **Home Page Console** → F12 → Console
   - ✅ Should see "Total events fetched: X" (X > 0)
   - ❌ If 0, check database
   - ❌ If errors, read error message

## 🎯 Most Common Fixes

### Fix #1: Missing Environment Variables (90% of issues)
**Check your deployment platform → Settings → Environment Variables**

Required variables:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL
```

After adding, **REDEPLOY**.

### Fix #2: No Events in Database
**Go to:** `/admin/create-event`
**Create:** One test event
**Refresh:** Home page

### Fix #3: Wrong Database URL
**Check:** Deployment uses PRODUCTION database
**Not:** Local development database
**Fix:** Update DATABASE_URL in deployment settings

## 🚨 Error → Solution Map

| Error in Console | Cause | Fix |
|-----------------|-------|-----|
| `Response status: 404` | API routes not deployed | Rebuild & redeploy |
| `Response status: 500` | Database connection failed | Check environment vars |
| `Total events fetched: 0` | No events in DB | Add events via admin |
| `CORS error` | Cross-origin issue | Add CORS headers |
| `Network error` | Can't reach API | Check deployment URL |

## 📊 Decision Tree

```
Events not showing?
  │
  ├─► Check /api/health
  │     │
  │     ├─► Returns "healthy"
  │     │     └─► Check /api/events
  │     │           │
  │     │           ├─► Returns events array
  │     │           │     └─► Check browser console
  │     │           │           │
  │     │           │           ├─► "Total events: 0"
  │     │           │           │     └─► Add events in database
  │     │           │           │
  │     │           │           └─► See events count > 0
  │     │           │                 └─► EventCard component issue
  │     │           │                       └─► Check FIX_SUMMARY.md
  │     │           │
  │     │           └─► Returns empty []
  │     │                 └─► No events in database
  │     │                       └─► Create event via admin panel
  │     │
  │     └─► Returns "unhealthy" or error
  │           └─► Environment variables missing
  │                 └─► Add env vars & redeploy
  │
  └─► /api/health returns 404
        └─► API routes not deployed
              └─► Rebuild & redeploy
```

## ⚡ Emergency Quick Fixes

### If completely broken:
```bash
# 1. Clear cache
rm -rf .next

# 2. Reinstall dependencies
npm install

# 3. Rebuild
npm run build

# 4. Redeploy
git add .
git commit -m "Fix deployment"
git push origin main
```

### If events exist but don't show:
```sql
-- Run in Supabase SQL Editor
UPDATE events 
SET status = 'UPCOMING' 
WHERE status IS NULL;
```

### If images don't show:
Check `imageUrl` field in database is not null and is valid URL.

## 📱 Contact Support Checklist

Before asking for help, have these ready:
1. ✅ Screenshot of `/api/health` response
2. ✅ Screenshot of `/api/events` response
3. ✅ Screenshot of browser console errors
4. ✅ Deployment platform name (Vercel, Netlify, etc.)
5. ✅ List of environment variables set (names only, not values)

## 🎓 Learn More

- **Full Guide:** `DEPLOYMENT_DEBUGGING.md`
- **Fix Summary:** `FIX_SUMMARY.md`
- **Image Issues:** `IMAGE_DEBUGGING_GUIDE.md`
- **Deployment:** `DEPLOYMENT_CHECKLIST.md`

---

## 💡 Pro Tips

1. **Always check health endpoint first** - It tells you if basic setup works
2. **Console logs are your friend** - Open DevTools before loading page
3. **Test locally with production build** - `npm run build && npm start`
4. **Environment variables need redeploy** - Changing them requires redeployment
5. **Database vs API** - If API works but no events, it's a database issue

---

**Last Updated:** After implementing comprehensive logging and health checks
**Status:** Ready for deployment testing
