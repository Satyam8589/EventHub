# Instagram Reels Integration Setup Guide

## 🎯 Overview

This feature allows your EventHub website to display Instagram posts as reels when users post with specific hashtags. **No data is stored in your database** - posts are fetched directly from Instagram in real-time!

## 📋 Prerequisites

1. An Instagram Business or Creator account
2. A Facebook Page connected to your Instagram account
3. A Facebook Developer account

## 🚀 Step-by-Step Setup

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in your app details:
   - **App Name**: EventHub Instagram Integration
   - **App Contact Email**: Your email
5. Click **"Create App"**

### Step 2: Add Instagram Graph API

1. In your app dashboard, find **"Instagram Graph API"**
2. Click **"Set Up"**
3. Follow the prompts to connect your Instagram Business Account

### Step 3: Get Your Access Token

#### Option A: Using Graph API Explorer (Recommended for Testing)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click **"Generate Access Token"**
4. Grant the following permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
5. Copy the generated access token

#### Option B: Long-Lived Access Token (Recommended for Production)

1. Get a short-lived token from Graph API Explorer (as above)
2. Exchange it for a long-lived token using this URL:
   ```
   https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
   ```
3. This token lasts 60 days and can be refreshed

### Step 4: Get Your Instagram Business Account ID

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Make a GET request to: `/me/accounts`
3. Find your Facebook Page ID
4. Make another GET request to: `/PAGE_ID?fields=instagram_business_account`
5. Copy the `instagram_business_account` ID

### Step 5: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id_here

# Hashtags to track (comma-separated, no # symbol)
INSTAGRAM_HASHTAGS=eventhub,youreventname,music,technology
```

### Step 6: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/reels` on your website

3. Post something on Instagram with one of your configured hashtags (e.g., `#eventhub`)

4. Wait a few minutes for Instagram to index the post

5. Refresh the reels page - your post should appear!

## 🎨 How It Works

1. **User posts on Instagram** with a specific hashtag (e.g., `#eventhub`)
2. **Instagram indexes** the post with that hashtag
3. **Your website fetches** posts with those hashtags using the Instagram Graph API
4. **Posts are displayed** in a beautiful reels-style interface
5. **No database storage** - everything is fetched in real-time

## 🏷️ Hashtag Configuration

You can configure which hashtags to track in your `.env.local`:

```env
INSTAGRAM_HASHTAGS=eventhub,myevent2024,techconference,musicfest
```

Users can filter by specific hashtags using the tag buttons at the top of the reels page.

## 🔄 API Rate Limits

Instagram Graph API has rate limits:
- **200 calls per hour** per user
- **4800 calls per day** per app

The reels page caches results on the client side to minimize API calls.

## 🛠️ Troubleshooting

### "Unable to load posts" Error

1. **Check your access token**: Make sure it's valid and not expired
2. **Verify permissions**: Ensure you have the required Instagram permissions
3. **Check account type**: Must be an Instagram Business or Creator account
4. **Verify hashtags**: Make sure posts exist with your configured hashtags

### No Posts Showing

1. **Wait for indexing**: Instagram can take 5-30 minutes to index new hashtags
2. **Check hashtag spelling**: Must match exactly (case-insensitive)
3. **Verify account**: Posts must be from public Instagram accounts
4. **Check API limits**: You might have hit rate limits

### Access Token Expired

Long-lived tokens expire after 60 days. To refresh:

1. Generate a new short-lived token
2. Exchange it for a long-lived token
3. Update your `.env.local` file
4. Restart your server

## 📱 Features

✅ Real-time Instagram post fetching  
✅ Hashtag-based filtering  
✅ Beautiful reels-style UI  
✅ Vertical scrolling (mouse wheel & touch)  
✅ Video and image support  
✅ Like and comment counts from Instagram  
✅ Direct links to view posts on Instagram  
✅ No database storage required  
✅ Responsive design (mobile & desktop)  

## 🔗 Useful Links

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Facebook Developer Console](https://developers.facebook.com/apps/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)

## 💡 Tips

1. **Use specific hashtags**: Create unique hashtags for your events (e.g., `#EventHub2024`)
2. **Encourage users**: Ask attendees to post with your hashtags
3. **Monitor regularly**: Check the reels page to see user-generated content
4. **Refresh tokens**: Set a reminder to refresh your access token every 60 days

## 🎉 That's It!

Your Instagram Reels integration is now set up! Users can post on Instagram with your hashtags, and their content will automatically appear on your website in a beautiful reels format.

Need help? Check the troubleshooting section above or consult the Instagram Graph API documentation.

