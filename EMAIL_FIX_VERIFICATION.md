# Email Configuration Verification Checklist

## ✅ Changes Made
- [x] Removed 15-second delay from email sending
- [x] Changed to synchronous email sending (await)
- [x] Email now sends before serverless function terminates

## 🔧 Environment Variables to Verify

### Required for Email Sending:
1. **GMAIL_USER** - Your Gmail address (e.g., `youremail@gmail.com`)
2. **GMAIL_APP_PASSWORD** - Gmail App Password (NOT your regular password)

### How to Set Up Gmail App Password:
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled
3. Go to Security → 2-Step Verification → App passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password (no spaces)
6. Add it to Vercel environment variables

## 📝 Vercel Environment Variables Setup

### To check/set environment variables in Vercel:
1. Go to your Vercel dashboard
2. Select your EventHub project
3. Go to Settings → Environment Variables
4. Verify these variables exist:
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`

### After adding/updating variables:
- Redeploy your application for changes to take effect
- Or trigger a new deployment from the Deployments tab

## 🧪 Testing Steps

### 1. Local Testing (Optional)
If you want to test locally first:
```bash
# Create .env.local file with:
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Then run:
npm run dev
```

### 2. Production Testing (Recommended)
1. Deploy the updated code to Vercel
2. Make a test booking with a small amount
3. Check Vercel function logs for email sending status
4. Verify email arrives in inbox

## 🔍 Debugging Email Issues

### Check Vercel Logs:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to "Functions" tab
4. Find the `/api/payment/verify` function
5. Look for these log messages:
   - ✅ `"📧 Sending ticket email immediately..."`
   - ✅ `"✅ Ticket email sent successfully for booking:"`
   - ❌ `"❌ Ticket email failed:"` (if there's an error)

### Common Issues:
- **"Email not configured"** → Missing GMAIL_USER or GMAIL_APP_PASSWORD
- **"Invalid credentials"** → Wrong app password or using regular password
- **"Authentication failed"** → Need to use App Password, not regular password
- **Email in spam** → Check spam folder, mark as "Not Spam"

## 📧 Expected Email Flow

After successful payment:
1. Payment verified ✅
2. Booking confirmed in database ✅
3. Push notification sent (payment success) ✅
4. **Email sent immediately** ✅ ← This is what we fixed
5. Push notification sent (ticket sent) ✅
6. HTTP response returned to user ✅

## 🎯 Next Actions

1. [ ] Verify GMAIL_USER is set in Vercel
2. [ ] Verify GMAIL_APP_PASSWORD is set in Vercel
3. [ ] Deploy the updated code to Vercel
4. [ ] Make a test booking
5. [ ] Check Vercel logs
6. [ ] Verify email received

---

**Note**: The code change is complete. The only remaining step is ensuring your Gmail credentials are properly configured in Vercel's environment variables.
