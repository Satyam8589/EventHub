# 🎯 SIMPLIFIED GUIDE: Get Instagram API Credentials in 10 Minutes

## 📋 What You'll Get

By the end of this guide, you'll have:
1. ✅ `INSTAGRAM_ACCESS_TOKEN` - Your API access token
2. ✅ `INSTAGRAM_BUSINESS_ACCOUNT_ID` - Your Instagram account ID
3. ✅ `INSTAGRAM_HASHTAGS` - Your custom hashtags (you choose these!)

---

## 🚀 PART 1: Get Your Access Token (5 minutes)

### Option A: Quick Method (For Testing - Token expires in 1 hour)

1. **Go to Graph API Explorer**
   - Visit: https://developers.facebook.com/tools/explorer/
   - Click **"Login"** (top right) and log in with your Facebook account

2. **Select Your App** (or create one)
   - If you don't have an app yet:
     - Click **"Create App"** button
     - Select **"Business"** type
     - Name it: "EventHub Instagram"
     - Click **"Create App"**
   
3. **Generate Access Token**
   - In Graph API Explorer, look for **"Meta App"** dropdown
   - Select your app (EventHub Instagram)
   - Click **"Generate Access Token"** button
   - Check these permissions:
     - ✅ `instagram_basic`
     - ✅ `pages_read_engagement`
     - ✅ `pages_show_list`
   - Click **"Generate Access Token"**
   - **COPY THE TOKEN** - This is your `INSTAGRAM_ACCESS_TOKEN`

   ```
   Example token:
   EAABwzLixnjYBO7ZCxKZBqZCZCZCZC...
   ```

### Option B: Long-Lived Token (For Production - Lasts 60 days)

After getting a short-lived token from Option A:

1. **Exchange for Long-Lived Token**
   - Open this URL in your browser (replace the values):
   ```
   https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN
   ```
   
   Where:
   - `YOUR_APP_ID` = Found in your Facebook App Dashboard → Settings → Basic
   - `YOUR_APP_SECRET` = Found in same place (click "Show")
   - `YOUR_SHORT_TOKEN` = The token from Option A

2. **Copy the Response**
   - You'll get a JSON response with `access_token`
   - **This is your long-lived `INSTAGRAM_ACCESS_TOKEN`**

---

## 🆔 PART 2: Get Your Instagram Business Account ID (3 minutes)

1. **Go to Graph API Explorer**
   - Visit: https://developers.facebook.com/tools/explorer/
   - Make sure your app is selected

2. **Get Your Facebook Page ID**
   - In the query box, type: `/me/accounts`
   - Click **"Submit"** button
   - You'll see a list of your Facebook Pages
   - Find your page and **copy the `id`** number

   ```json
   Example response:
   {
     "data": [
       {
         "id": "123456789012345",  ← COPY THIS
         "name": "Your Page Name"
       }
     ]
   }
   ```

3. **Get Your Instagram Business Account ID**
   - In the query box, type: `/YOUR_PAGE_ID?fields=instagram_business_account`
   - Replace `YOUR_PAGE_ID` with the ID from step 2
   - Click **"Submit"**
   - **Copy the `instagram_business_account` → `id`**

   ```json
   Example response:
   {
     "instagram_business_account": {
       "id": "17841400008460056"  ← THIS IS YOUR INSTAGRAM_BUSINESS_ACCOUNT_ID
     }
   }
   ```

---

## 🏷️ PART 3: Choose Your Hashtags (1 minute)

This is the easiest part! Just decide which hashtags you want to track:

```env
INSTAGRAM_HASHTAGS=eventhub,music,technology,food,travel
```

**Tips:**
- Use **lowercase** only
- **No # symbol** needed
- Separate with **commas** (no spaces)
- Choose hashtags that are **unique to your events**
- Example: `eventhub2024`, `youreventname`, `techconference`

---

## ✅ FINAL STEP: Add to .env.local

Create or edit your `.env.local` file and add:

```env
# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=EAABwzLixnjYBO7ZCxKZBqZCZCZCZC...
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400008460056
INSTAGRAM_HASHTAGS=eventhub,music,technology
```

**Then restart your server:**
```bash
npm run dev
```

---

## 🎉 Test It!

1. Visit: `http://localhost:3000/reels`
2. Post something on Instagram with `#eventhub`
3. Wait 5-10 minutes for Instagram to index it
4. Refresh your reels page - it should appear!

---

## 🆘 Troubleshooting

### "Access token is invalid"
- Make sure you copied the entire token (they're very long!)
- Check if it expired (short-lived tokens last 1 hour)
- Generate a new one from Graph API Explorer

### "Instagram account not found"
- Make sure your Instagram is a **Business** or **Creator** account
- Verify it's connected to a Facebook Page
- Double-check the account ID

### "No posts showing"
- Wait 10-30 minutes after posting (Instagram needs time to index)
- Make sure the post is **public**
- Check the hashtag spelling matches exactly
- Try posting with multiple hashtags

---

## 📱 Quick Reference

| What | Where to Get It |
|------|----------------|
| **Access Token** | https://developers.facebook.com/tools/explorer/ → Generate Access Token |
| **Page ID** | Graph API Explorer → `/me/accounts` |
| **Instagram ID** | Graph API Explorer → `/PAGE_ID?fields=instagram_business_account` |
| **Hashtags** | You choose them! (e.g., eventhub,music,tech) |

---

## 🔗 Useful Links

- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Facebook Apps Dashboard**: https://developers.facebook.com/apps/
- **Token Debugger**: https://developers.facebook.com/tools/debug/accesstoken/
- **Instagram Business Setup**: https://www.facebook.com/business/instagram

---

**Need more help?** Check the detailed guide in `INSTAGRAM_SETUP.md` or the Instagram Graph API documentation.
