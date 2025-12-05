# 🚀 EASIEST WAY: Get Instagram API Credentials (5 Minutes)

## ✅ What You Need First

1. **Instagram Business Account** (not personal)
   - If you have a personal account, convert it:
   - Instagram App → Settings → Account → "Switch to Professional Account"
   
2. **Facebook Account** (any Facebook account works)

---

## 🎯 METHOD 1: Use Instagram Basic Display (EASIEST!)

This is simpler than Instagram Graph API and works for most use cases.

### Step 1: Create Facebook App (2 minutes)

1. **Open**: https://developers.facebook.com/apps/
2. **Click**: "Create App" button (green button, top right)
3. **Select**: "Consumer" (not Business)
4. **Fill in**:
   - App Name: `EventHub Reels`
   - App Contact Email: Your email
5. **Click**: "Create App"

### Step 2: Add Instagram Basic Display (1 minute)

1. In your app dashboard, scroll down to **"Add Products"**
2. Find **"Instagram Basic Display"**
3. Click **"Set Up"** button
4. Scroll to bottom, click **"Create New App"**
5. Fill in:
   - Display Name: `EventHub`
   - Valid OAuth Redirect URIs: `https://localhost:3000/`
   - Deauthorize Callback URL: `https://localhost:3000/`
   - Data Deletion Request URL: `https://localhost:3000/`
6. Click **"Save Changes"**

### Step 3: Add Instagram Tester (1 minute)

1. Scroll to **"User Token Generator"** section
2. Click **"Add or Remove Instagram Testers"**
3. This opens Instagram in a new tab
4. **Approve** yourself as a tester
5. Go back to Facebook Developers tab

### Step 4: Generate Access Token (1 minute)

1. In **"User Token Generator"** section
2. Click **"Generate Token"** next to your Instagram account
3. Click **"Authorize"** in the popup
4. **COPY THE TOKEN** - This is your `INSTAGRAM_ACCESS_TOKEN`!

### Step 5: Get Your Instagram User ID

The token you just got contains your user ID. To extract it:

1. Go to: https://developers.facebook.com/tools/debug/accesstoken/
2. Paste your access token
3. Look for **"User ID"** in the response
4. **COPY THIS** - This is your `INSTAGRAM_BUSINESS_ACCOUNT_ID`!

---

## 📝 Add to .env.local

```env
# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=IGQVJ... (paste your token here)
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841... (paste your user ID here)
INSTAGRAM_HASHTAGS=eventhub,music,technology
```

---

## 🎉 Done!

Now restart your server:
```bash
npm run dev
```

Visit: http://localhost:3000/reels

---

## ⚠️ IMPORTANT NOTES

**Token Expiry**: Instagram Basic Display tokens expire after 60 days.

**To Refresh**:
1. Go back to your app dashboard
2. Click "Generate Token" again
3. Update your .env.local

---

## 🆘 Still Having Issues?

If this doesn't work, we have **METHOD 2** below using Instagram Graph API (more complex but more powerful).

---

## 🎯 METHOD 2: Instagram Graph API (More Features)

Only use this if Method 1 doesn't work for you.

### Requirements:
- Instagram **Business** or **Creator** account (not personal!)
- Connected to a Facebook Page

### Quick Steps:

1. **Create App**: https://developers.facebook.com/apps/ → "Create App" → "Business"
2. **Add Instagram Graph API**: In app dashboard → "Add Product" → "Instagram Graph API"
3. **Get Token**: https://developers.facebook.com/tools/explorer/
   - Select your app
   - Click "Generate Access Token"
   - Select permissions: `instagram_basic`, `pages_read_engagement`
   - Copy the token
4. **Get Account ID**:
   - In Graph API Explorer, query: `/me/accounts`
   - Copy your page ID
   - Query: `/YOUR_PAGE_ID?fields=instagram_business_account`
   - Copy the instagram_business_account ID

---

## 💡 Which Method Should You Use?

- **Method 1 (Instagram Basic Display)**: ✅ Easier, works for personal content
- **Method 2 (Instagram Graph API)**: ✅ More features, works for hashtag search

**For your use case (hashtag-based reels), you'll need Method 2.**

But try Method 1 first to test if everything works!

---

## 🔗 Helpful Links

- Facebook Apps: https://developers.facebook.com/apps/
- Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Token Debugger: https://developers.facebook.com/tools/debug/accesstoken/
- Instagram Business Setup: https://help.instagram.com/502981923235522

---

**Need more help?** Let me know which step you're stuck on!
