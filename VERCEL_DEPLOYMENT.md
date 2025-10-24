# Vercel Deployment Guide - EventHub

## ✅ Fixed Issues

- Configured Prisma to work with Neon Database (serverless PostgreSQL)
- Added Neon adapter for serverless environments
- Updated schema with `directUrl` for migrations
- Configured proper build settings

## 🔧 Required Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

### Database (from Neon Dashboard)

```
DATABASE_URL="postgresql://neondb_owner:..."  # Pooled connection string
DIRECT_URL="postgresql://neondb_owner:..."    # Direct connection string
```

### Email (Gmail)

```
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
```

### Gemini AI

```
GEMINI_API_KEY="your-gemini-api-key"
```

### Firebase

```
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
```

### Cloudinary (if using image uploads)

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

## 📝 How to Get Neon Database URLs

1. Go to your Neon project dashboard: https://console.neon.tech
2. Click on your database
3. Go to "Connection Details"
4. Copy both:
   - **Pooled connection string** → Use as `DATABASE_URL`
   - **Direct connection string** → Use as `DIRECT_URL`

## 🚀 Deployment Steps

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Fix Prisma Neon configuration for Vercel"
   git push origin main
   ```

2. **In Vercel Dashboard:**

   - Add all environment variables (listed above)
   - Redeploy your project

3. **Verify deployment:**
   - Check build logs for any errors
   - Test database connection by visiting your site

## 🔍 Troubleshooting

### Error: "Can't reach database server"

- ✅ Verify `DATABASE_URL` in Vercel matches your Neon pooled connection string
- ✅ Verify `DIRECT_URL` in Vercel matches your Neon direct connection string
- ✅ Check that your Neon database is active (not paused)

### Error: "Prisma Client could not locate the Query Engine"

- ✅ This is now fixed with `postinstall` script in package.json
- ✅ Vercel will run `prisma generate` automatically

### Error: "Connection pool timeout"

- ✅ This is fixed by using Neon adapter with connection pooling
- ✅ Make sure you're using the **pooled** connection string

## 📦 What Was Changed

### Files Modified:

1. **prisma/schema.prisma** - Added `directUrl` for Neon
2. **src/lib/prisma.js** - Added Neon serverless adapter
3. **.env.production** - Added database URL placeholders
4. **vercel.json** - Added Prisma build configuration

### Dependencies (already installed):

- `@neondatabase/serverless` ✅
- `@prisma/adapter-neon` ✅
- `@prisma/client` ✅

## ✨ Benefits of This Setup

- **Serverless-ready**: Works perfectly with Vercel's serverless functions
- **Connection pooling**: Prevents "too many connections" errors
- **Fast cold starts**: Neon adapter optimized for serverless
- **Auto-scaling**: Database scales with your traffic

## 🎯 Next Steps

1. Add environment variables to Vercel
2. Redeploy your project
3. Test your application
4. Monitor for any errors in Vercel logs

---

**Need help?** Check Vercel logs or Neon logs for detailed error messages.
