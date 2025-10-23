# Email Ticket Delivery Setup

This guide will help you set up the email functionality so that users automatically receive their event tickets via email after booking.

## 📧 What You Need

1. A Gmail account to send emails from
2. A Google App Password (not your regular Gmail password)

## 🔧 Step-by-Step Setup

### 1. Enable 2-Step Verification on Your Google Account

1. Go to your [Google Account](https://myaccount.google.com/)
2. Navigate to **Security** in the left sidebar
3. Find **2-Step Verification** and click on it
4. Follow the prompts to enable 2-Step Verification (if not already enabled)

### 2. Create an App Password

1. After enabling 2-Step Verification, go back to **Security**
2. Find and click on **App passwords** (you may need to scroll down)
3. You might need to sign in again
4. In the "Select app" dropdown, choose **Mail**
5. In the "Select device" dropdown, choose **Other (Custom name)**
6. Type "EventHub" or any name you prefer
7. Click **Generate**
8. Google will display a 16-character password - **Copy this password immediately**
   - It looks like: `abcd efgh ijkl mnop` (with spaces)
   - You won't be able to see this password again

### 3. Add to Your Environment Variables

1. Open your `.env.local` file (or create it if it doesn't exist)
2. Add these two lines:

```env
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"
```

**Important Notes:**

- Replace `your_email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character app password you copied
- Remove any spaces from the app password when pasting it
- Keep these credentials SECRET - never commit `.env.local` to git

### 4. Verify Setup

Your `.env.local` file should now look something like this:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_FIREBASE_API_KEY="..."
# ... other variables ...

# Gmail Configuration
GMAIL_USER="youremail@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"

# Gemini API Key
GEMINI_API_KEY="AIzaSyAN6-3EWg6EGm-o_8CnuyaX3l2ekcDKx7Q"
```

### 5. Restart Your Development Server

After adding the environment variables:

```bash
# Stop your dev server (Ctrl+C) if it's running
# Then start it again
npm run dev
```

## ✅ Testing

1. Go to your EventHub website
2. Book a ticket for any event
3. Check the email inbox you used during booking
4. You should receive:
   - A beautiful HTML email with booking details
   - An attached PNG image of your ticket with QR code

## 🚨 Troubleshooting

### Email not received?

**Check the terminal logs:**

- Look for `✅ Ticket email sent successfully` - this means it worked!
- Look for `⚠️ Failed to send ticket email` - there's a configuration issue
- Look for `Email transporter not configured` - you need to add Gmail credentials

**Common issues:**

1. **"Invalid login" error**

   - Make sure you're using an App Password, not your regular Gmail password
   - Verify 2-Step Verification is enabled on your Google Account

2. **"Email not configured" in logs**

   - Check that `GMAIL_USER` and `GMAIL_APP_PASSWORD` are in `.env.local`
   - Restart your dev server after adding environment variables

3. **Email goes to spam**

   - This is normal for development
   - Check your spam/junk folder
   - In production, you should use a professional email service

4. **App Password option not available**
   - Make sure 2-Step Verification is enabled first
   - Wait a few minutes and try again
   - Some Google Workspace accounts may have this disabled by admins

### Still not working?

Check your terminal for detailed error messages. The booking will still succeed even if email sending fails, so users won't be blocked.

## 📝 How It Works

When a user books a ticket:

1. **Booking is created** in the database
2. **Ticket image is generated** on the server using Canvas
   - Includes event details, QR code, booking ID
   - Same design as the downloadable ticket
3. **Beautiful email is composed** with event details
4. **Email is sent** with the ticket image attached
5. **Booking response** is returned immediately (email happens in background)

The email includes:

- 🎉 Personalized greeting with user's name
- 📅 Complete event details (date, time, location, venue)
- 📋 Booking information (ID, ticket count, amount)
- 📸 Attached ticket image with QR code
- 📝 Instructions for using the ticket

## 🔐 Security Best Practices

✅ **Do:**

- Use App Passwords (never regular Gmail password)
- Keep `.env.local` in `.gitignore`
- Use different credentials for production

❌ **Don't:**

- Commit credentials to version control
- Share your App Password
- Use the same credentials across multiple projects

## 🌟 Optional: Use a Professional Email Service

For production, consider using:

- **SendGrid** - Reliable, scalable email delivery
- **Amazon SES** - Cost-effective for high volumes
- **Mailgun** - Developer-friendly with good analytics
- **Postmark** - Great for transactional emails

These services provide better deliverability, analytics, and won't end up in spam.

## 📞 Need Help?

If you're still having issues:

1. Check the server logs in your terminal
2. Verify all environment variables are set correctly
3. Make sure your Gmail account has 2-Step Verification enabled
4. Try creating a new App Password if the current one doesn't work
