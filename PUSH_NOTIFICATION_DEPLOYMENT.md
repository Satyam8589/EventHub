# Deployment Checklist for Push Notifications

## ✅ Verify These Settings in Your Deployment Platform (Vercel/Netlify/etc.)

### 1. Environment Variables

Make sure ALL these variables are set in your deployment:

```
NEXT_PUBLIC_VAPID_KEY=BH30cOjINIYZuSXLgFQZokDAumLxE-_YubvBBlhy8Wh6vgrIwcmXsrEvJK24reNc3-EmOqSxnzsWhX75jkhXPyM
VAPID_PRIVATE_KEY=WY30CkJ3bObqwB1HP-b-h0GKgCwHiTXLTFI9hz5tQCg
VAPID_EMAIL=mailto:join.eventhub@gmail.com
```

### 2. Service Worker Configuration

- Service worker MUST be at `/public/sw.js`
- Must be accessible at `https://yourdomain.com/sw.js`
- Check by visiting: `https://www.eventhubx.site/sw.js`

### 3. HTTPS Requirement

- Push notifications ONLY work on HTTPS (not HTTP)
- Make sure your domain uses HTTPS

### 4. Browser Console Checks

On your deployed site, open browser console and check for:

**Success logs:**

```
✅ AutoPush: Browser supports push notifications
✅ AutoPush: Service worker ready
✅ AutoPush: Permission granted
✅ AutoPush: VAPID key available
✅ AutoPush: Subscribed successfully
```

**Error logs to watch for:**

```
❌ AutoPush: VAPID key missing
❌ AutoPush: Service worker error
❌ AutoPush: Permission denied
```

### 5. Test on Deployed Site

1. Go to: `https://www.eventhubx.site/test-push`
2. Sign in
3. Click "Check Service Worker" - should show active
4. Click "Subscribe" - should work
5. Click "Send Test Notification" - should receive notification

### 6. Common Issues

**Issue: "VAPID key missing"**

- Solution: Add `NEXT_PUBLIC_VAPID_KEY` to deployment environment variables
- Must start with `NEXT_PUBLIC_` to be available in browser

**Issue: "Service worker not registered"**

- Solution: Check if `/sw.js` is accessible on your domain
- Clear browser cache and reload

**Issue: "No notifications received"**

- Solution: Check browser notification permissions
- Make sure Focus Assist (Windows) is OFF
- Try different browser

**Issue: "Failed to send: 410 Gone"**

- Solution: Old/expired subscription - click "Cleanup Invalid" button

### 7. Redeploy Checklist

After adding environment variables:

1. ✅ Add all 3 VAPID variables to deployment
2. ✅ Redeploy the application
3. ✅ Clear browser cache (Ctrl+Shift+R)
4. ✅ Test on `/test-push` page
5. ✅ Check browser console for logs

### 8. Domain-Specific Note

Your site: `https://www.eventhubx.site`

Verify these URLs are accessible:

- `https://www.eventhubx.site/sw.js` ✅
- `https://www.eventhubx.site/api/push/subscribe` ✅
- `https://www.eventhubx.site/api/push/vapid-key` ✅
- `https://www.eventhubx.site/test-push` ✅
