# Contact Form Email Debugging Guide

## Issue: Contact form shows "sent" but emails not received

## Recent Fixes Applied

1. **Fixed Email Configuration**: Updated to send FROM and TO the same Gmail account (`join.eventhub@gmail.com`)
2. **Added Reply-To**: Contact form submitter's email is set as reply-to for easy responses
3. **Enhanced Logging**: Added detailed console logging for debugging
4. **Better Error Handling**: Contact form now shows specific errors if email fails
5. **Connection Testing**: Added verification step before sending emails

## Testing Steps

### 1. Test Email Configuration

Visit: `http://localhost:3000/api/test-email` (or your deployed URL)

This will:

- Check if environment variables are set
- Test Gmail connection
- Send a test email to your inbox
- Return detailed results

### 2. Check Environment Variables

Your `.env.local` should have:

```
GMAIL_USER="join.eventhub@gmail.com"
GMAIL_APP_PASSWORD="wzux sdrd emhl cbcn"
```

### 3. Verify Gmail Settings

For `join.eventhub@gmail.com`:

- ✅ 2-Factor Authentication enabled
- ✅ App Password generated (`wzux sdrd emhl cbcn`)
- ✅ "Less secure app access" NOT needed (using App Password)

### 4. Check Console Logs

When testing the contact form, look for these logs:

- 🚀 Starting email sending process...
- 📧 Email config: {...}
- 🔍 Testing email connection...
- ✅ Email connection verified successfully!
- 📧 Sending test email...
- ✅ Email sent successfully!

## Common Issues & Solutions

### 1. "Invalid login" error

- **Problem**: Wrong Gmail credentials
- **Solution**: Regenerate Gmail App Password

### 2. "Authentication failed" error

- **Problem**: 2FA not enabled or App Password incorrect
- **Solution**: Enable 2FA and create new App Password

### 3. Emails go to Spam

- **Problem**: Gmail filtering automated emails
- **Solution**: Check spam folder, mark as "Not Spam"

### 4. No error but no email received

- **Problem**: Gmail connection works but delivery fails silently
- **Solution**: Check Gmail quotas and limits

### 5. "Connection timeout" error

- **Problem**: Network/firewall blocking SMTP
- **Solution**: Check if port 587/465 is blocked

## Email Flow

1. **User submits** contact form
2. **Server validates** form data
3. **Server creates** Gmail transporter
4. **Server tests** connection with `transporter.verify()`
5. **Server sends** email with form details
6. **Email delivered** to `join.eventhub@gmail.com`
7. **User receives** success confirmation

## Quick Debug Commands

```bash
# Test the email API directly
curl http://localhost:3000/api/test-email

# Check logs during contact form submission
npm run dev
# Then submit contact form and watch console
```

## Production Deployment

When deploying (Vercel, etc.), ensure these environment variables are set:

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

## Success Indicators

✅ Test email endpoint returns `{"success": true}`
✅ Contact form shows success message  
✅ Console logs show "Email sent successfully"
✅ Email appears in `join.eventhub@gmail.com` inbox
✅ Email has "Reply-To" set to form submitter

If you're still not receiving emails after these fixes, the test email endpoint will help identify the specific issue!
