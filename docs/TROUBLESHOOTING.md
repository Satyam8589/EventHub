# Troubleshooting Guide - Event Report Generation

## Common Issues and Solutions

### 1. ✅ FIXED: Gemini AI Model Not Found (404 Error)

**Error Message**:
```
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent: [404 Not Found] models/gemini-1.5-flash is not found for API version v1beta
```

**Cause**: The model name `gemini-1.5-flash` is not available for the v1beta API version.

**Solution**: ✅ **FIXED** - Changed model to `gemini-pro`

**File Updated**: `src/app/api/admin/generate-event-report/route.js`

**Change Made**:
```javascript
// Before (incorrect)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// After (correct)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

---

### 2. Organizer Email Not Found

**Error Message**: "Organizer email not found for this event"

**Solution**:
1. Go to Admin → Manage Events
2. Click "Edit" on the event
3. Add/update the "Organizer Email" field
4. Save the event
5. Try generating the report again

---

### 3. Email Not Sending

**Error Message**: "Report generated but failed to send email"

**Possible Causes**:
- Gmail credentials not configured
- Invalid Gmail App Password
- Network issues

**Solution**:
1. Check `.env.local` file has:
   ```env
   GMAIL_USER="your-email@gmail.com"
   GMAIL_APP_PASSWORD="your-app-password"
   ```
2. Verify Gmail App Password is correct (16 characters, no spaces)
3. Test email service with `/api/test-email` endpoint
4. Check internet connection

---

### 4. Gemini API Key Issues

**Error Message**: "API key not valid" or similar

**Solution**:
1. Check `.env.local` has:
   ```env
   GEMINI_API_KEY="your-api-key"
   ```
2. Verify API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Check API quota hasn't been exceeded
4. Restart the development server after updating `.env.local`

---

### 5. No Bookings Data

**Symptom**: Report is empty or has no user data

**Solution**:
- Ensure the event has at least one confirmed booking
- Check database for booking records
- Verify bookings are associated with the correct event ID

---

### 6. Report Generation Timeout

**Symptom**: Request takes too long and times out

**Solution**:
- This is normal for events with many bookings (can take 10-20 seconds)
- Wait for the process to complete
- Check server logs for progress
- If it consistently fails, the event may have too much data

---

### 7. Button Not Appearing

**Symptom**: "📊 Report" button is not visible

**Solution**:
1. Verify you're logged in as SUPER_ADMIN
2. Refresh the page
3. Check browser console for errors
4. Clear browser cache
5. Verify the code changes were saved

---

### 8. Multiple Clicks / Duplicate Reports

**Symptom**: Accidentally clicked button multiple times

**Solution**:
- The button is disabled during generation (shows "Sending...")
- Only one report will be generated
- Wait for the first request to complete

---

## Testing the Fix

After the model name fix, test the feature:

1. **Navigate** to Admin → Manage Events
2. **Find** an event with bookings and organizer email
3. **Click** the "📊 Report" button
4. **Confirm** the dialog
5. **Wait** for success message (5-15 seconds)
6. **Check** organizer's email for the report

---

## Verification Checklist

Before reporting an issue, verify:

- [ ] Using SUPER_ADMIN account
- [ ] Event has organizer email set
- [ ] Event has at least one confirmed booking
- [ ] `.env.local` has all required variables:
  - [ ] GEMINI_API_KEY
  - [ ] GMAIL_USER
  - [ ] GMAIL_APP_PASSWORD
- [ ] Development server is running
- [ ] No errors in browser console
- [ ] Internet connection is active

---

## Debug Mode

To see detailed logs:

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Click "📊 Report" button
4. Watch for log messages:
   - `📊 Generating report for event: [id]`
   - `🤖 Sending data to Gemini AI for analysis...`
   - `✅ Report generated successfully`
   - `📧 Sending report to: [email]`
   - `✅ Report email sent successfully`

---

## Server Logs

Check terminal/console for server-side logs:

```
📊 Generating report for event: [event-id]
🤖 Sending data to Gemini AI for analysis...
✅ Report generated successfully
📧 Sending report to: [organizer-email]
✅ Report email sent successfully
```

---

## Known Limitations

1. **AI Processing**: Limited to 50 user records for performance
2. **Email Size**: Very large reports may have formatting issues
3. **Generation Time**: Can take 10-20 seconds for large events
4. **API Quota**: Gemini AI has daily usage limits

---

## Getting Help

If issues persist:

1. **Check Logs**: Browser console and server terminal
2. **Verify Config**: All environment variables are set
3. **Test Components**:
   - Test email: `/api/test-email`
   - Test database: Check Supabase dashboard
   - Test Gemini: Try a simple API call
4. **Contact Support**: Provide error messages and logs

---

## Recent Fixes

### November 2025
- ✅ Fixed Gemini AI model name (gemini-1.5-flash → gemini-pro)
- ✅ Updated API endpoint to handle model compatibility

---

**Last Updated**: November 2025  
**Status**: ✅ Issue Resolved
