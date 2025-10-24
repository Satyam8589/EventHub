# Gmail Setup Guide for Contact Form

## Current Issue

Gmail is rejecting the login with error: "Username and Password not accepted"

## Required Gmail Setup Steps

### 1. Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "How you sign in to Google", select **2-Step Verification**
3. Follow the setup process to enable 2FA

### 2. Generate App Password

1. After 2FA is enabled, go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "How you sign in to Google", select **2-Step Verification**
3. At the bottom, select **App passwords**
4. Select **Mail** as the app
5. Select **Other (custom name)** as the device
6. Enter "EventHub Website" as the name
7. Click **Generate**
8. Copy the 16-character app password (it will look like: `abcd efgh ijkl mnop`)

### 3. Update Environment Variables

Replace the current credentials in `.env.local`:

```bash
# Email Configuration
GMAIL_USER="join.eventhub@gmail.com"
GMAIL_APP_PASSWORD="your-new-16-char-password"
```

### 4. Verify Account Access

Make sure:

- You can log into `join.eventhub@gmail.com` manually
- 2-Factor Authentication is working
- App passwords are enabled
- The generated app password is copied correctly (no spaces)

### 5. Alternative Solution

If Gmail continues to have issues, we can:

1. Use a different email service (SendGrid, Mailgun, etc.)
2. Use a contact form that stores messages in the database instead
3. Set up email forwarding from a working Gmail account

## Test Steps

1. Update the app password in `.env.local`
2. Restart the development server
3. Test the contact form
4. Check the console logs for detailed error messages

## Common Issues

- **"Username and Password not accepted"**: Wrong app password or 2FA not enabled
- **"Less secure app access"**: Use app passwords instead of regular password
- **Account locked**: Too many failed attempts, wait 15 minutes and try again
