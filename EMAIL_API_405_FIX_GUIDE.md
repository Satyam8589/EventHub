# 405 Method Not Allowed - Comprehensive Fix Guide

## 🚨 Current Issue

**Error**: `POST https://event-hub-dusky.vercel.app/api/send-ticket-email 405 (Method Not Allowed)`

## 🔍 Diagnosis Steps

### 1. **Test API Health** (Wait 2-3 minutes for deployment)

```bash
# Test basic API availability
curl https://event-hub-dusky.vercel.app/api/send-ticket-email

# Expected response:
{
  "message": "Send ticket email API is running",
  "methods": ["GET", "POST"],
  "status": "active"
}
```

### 2. **Test Simplified Email API**

```bash
# Test the new simplified test API
curl https://event-hub-dusky.vercel.app/api/test-send-email

# Then test POST
curl -X POST https://event-hub-dusky.vercel.app/api/test-send-email \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🛠️ Enhanced Debugging Features

### **Added to Email API:**

1. ✅ **Comprehensive Logging**: Every step is now logged
2. ✅ **Content-Type Validation**: Validates request headers
3. ✅ **JSON Parsing Protection**: Handles malformed JSON gracefully
4. ✅ **GET Method**: Health check endpoint
5. ✅ **Environment Detection**: Shows deployment environment

### **Added to Frontend:**

1. ✅ **Response Status Logging**: Shows exact HTTP status codes
2. ✅ **Headers Inspection**: Logs response headers
3. ✅ **Raw Response Capture**: Shows actual server response
4. ✅ **Error Details**: Detailed error information in console

## 🔧 Alternative Solutions

### **Option 1: Fallback Email API**

If main API fails, we can implement a fallback:

```javascript
// In my-events page
const sendEmailWithFallback = async (bookingId) => {
  try {
    // Try main API first
    const response = await fetch("/api/send-ticket-email", {...});
    if (response.ok) return await response.json();

    // Fallback to test API
    console.log("Main API failed, trying fallback...");
    const fallbackResponse = await fetch("/api/test-send-email", {...});
    return await fallbackResponse.json();
  } catch (error) {
    console.error("Both APIs failed:", error);
    throw error;
  }
};
```

### **Option 2: Vercel Function Configuration**

Add to `vercel.json`:

```json
{
  "functions": {
    "src/app/api/send-ticket-email/route.js": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/send-ticket-email",
      "destination": "/api/send-ticket-email"
    }
  ]
}
```

### **Option 3: Edge Runtime Fix**

Add to API route:

```javascript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

## 📊 Monitoring Commands

### **Check Deployment Status:**

```bash
# Check if API is responding
curl -I https://event-hub-dusky.vercel.app/api/send-ticket-email

# Check Vercel deployment logs
# (Go to Vercel dashboard > Functions tab)
```

### **Browser Console Debugging:**

```javascript
// Test directly in browser console
fetch("/api/send-ticket-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ bookingId: "test-id" }),
})
  .then((r) => r.text())
  .then(console.log)
  .catch(console.error);
```

## 🎯 Expected Timeline

1. **Immediate (0-2 minutes)**: Enhanced debugging deployed
2. **2-3 minutes**: Vercel deployment completes
3. **3-5 minutes**: API should be responding properly
4. **If still failing**: Implement alternative solutions

## 🚨 Emergency Workaround

If the API continues to fail, temporarily disable email sending:

```javascript
// In my-events page, replace sendTicketEmail function:
const sendTicketEmail = async (booking) => {
  alert("Email feature temporarily disabled. Your ticket is still valid!");
  setEmailSent((prev) => new Set([...prev, booking.id]));
};
```

## 📋 Next Steps

1. **Wait 2-3 minutes** for deployment to complete
2. **Test the health endpoint** to confirm API is responding
3. **Try sending an email** from the app
4. **Check browser console** for detailed error logs
5. **If still failing**, implement fallback solutions

---

**Status**: ✅ Enhanced debugging deployed  
**ETA**: 2-3 minutes for Vercel deployment  
**Monitoring**: Browser console + Vercel dashboard
