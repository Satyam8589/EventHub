# Email Setup Instructions for Contact Form

## Current Configuration

Your contact form is now configured to send emails to `join.eventhub@gmail.com` using the Gmail credentials stored in your `.env.local` file.

### Environment Variables Used:

- `GMAIL_USER`: gabbar656521@gmail.com
- `GMAIL_APP_PASSWORD`: inyj xdqr uvou vikw

## How It Works

When someone submits the contact form on your website:

1. **Form Validation**: The system validates all required fields and email format
2. **Email Sending**: An email is sent to `join.eventhub@gmail.com` with:
   - Sender's name and email
   - Subject line
   - Full message content
   - Timestamp of submission
3. **User Feedback**: The user receives a success message
4. **Logging**: All submissions are also logged to console for debugging

## Email Format

You'll receive emails with:

- **Subject**: "Contact Form: [Original Subject]"
- **From**: gabbar656521@gmail.com (your sending email)
- **To**: join.eventhub@gmail.com (your receiving email)
- **Content**: Formatted HTML email with all form details

## Testing

To test the contact form:

1. Go to your website's contact page
2. Fill out the form completely
3. Submit the form
4. Check your `join.eventhub@gmail.com` inbox
5. Look for emails with subject starting "Contact Form:"

## Troubleshooting

If emails aren't being received:

1. **Check Spam Folder**: Gmail might filter these emails to spam initially
2. **Verify App Password**: Make sure the Gmail App Password is still valid
3. **Check Console Logs**: Look at your deployment logs for any email errors
4. **Gmail Security**: Ensure 2FA is enabled and App Passwords are allowed

## Security Notes

- Gmail App Passwords are used instead of regular passwords for security
- Environment variables keep credentials secure
- Emails are sent from your own Gmail account to avoid spam issues

## Production Deployment

When deploying to production (Vercel, etc.), make sure to add these environment variables:

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

The contact form will now successfully send emails to your inbox!
