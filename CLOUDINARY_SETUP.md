# 🚀 Cloudinary Setup Instructions

## Step 1: Get Your Cloudinary Credentials

1. Go to your Cloudinary Dashboard: https://cloudinary.com/console
2. Copy your **Cloud Name** and **API Secret**

## Step 2: Update Environment Variables

Create or update your `.env.local` file with:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_SECRET=your-actual-api-secret
```

## Step 3: API Key Already Set

✅ API Key is already configured: `136331188965169`

## Step 4: Test Upload

1. Login as Super Admin
2. Go to `/admin/create-event`
3. Upload an image
4. Check Cloudinary dashboard for uploads in "events" folder

## Features Implemented ✨

### 🖼️ Image Upload

- **Automatic Upload**: Images uploaded to Cloudinary "events" folder
- **Visual Feedback**: Upload progress and success indicators
- **File Validation**: Image format and size validation
- **Optimized URLs**: Auto-optimized image delivery

### 📹 Video Support Ready

- Upload endpoint supports videos (MP4, AVI, MOV, etc.)
- Max 100MB for videos, 10MB for images
- Automatic format optimization

### 🎯 API Endpoints

- `POST /api/upload` - Upload files to Cloudinary
- `DELETE /api/upload` - Delete files from Cloudinary
- `POST /api/events` - Create events (with Cloudinary images)

### 🔧 Developer Tools

- `useFileUpload` hook for easy uploads
- Image variant generation (thumbnail, medium, large)
- Cloudinary utilities in `/lib/cloudinary.js`

## 📁 File Structure

```
src/
├── lib/cloudinary.js          # Cloudinary configuration
├── hooks/useFileUpload.js     # Upload hook
├── app/api/upload/route.js    # Upload API
└── app/api/events/route.js    # Events API (updated)
```

## 🎨 UI Features

- Real-time upload progress
- Success/error indicators
- Image preview with status
- Disabled state during upload
- Visual confirmation of successful uploads

Your Cloudinary integration is ready! 🎉
