# AI-Powered Event Report Generation Feature

## Overview
This feature allows super admins to generate comprehensive, AI-powered event reports and automatically send them via email to event organizers.

## Features

### 1. **Automated Report Generation**
- Click the "📊 Report" button on any event card in the admin events page
- AI analyzes all event data including bookings, revenue, and attendee information
- Generates a professional, formatted HTML report

### 2. **Comprehensive Analytics**
The report includes:
- **Executive Summary**: Overview of event performance
- **Event Details**: Complete event information
- **Booking Analytics**: 
  - Total bookings (confirmed, pending, failed)
  - Revenue analysis
  - Attendance metrics
  - Capacity utilization
- **Financial Performance**:
  - Total revenue generated
  - Average revenue per booking
  - Revenue trends over time
- **Attendee Insights**:
  - Total unique attendees
  - Average tickets per booking
  - Booking patterns
- **User Information**: Complete attendee details with names, emails, and phone numbers
- **AI Recommendations**: Data-driven insights for future events

### 3. **Email Delivery**
- Report is automatically sent to the organizer's email (set during event creation)
- Professional email template with quick stats
- Full detailed report embedded in the email

## How to Use

### For Super Admins:

1. **Navigate to Events Page**
   - Go to Admin Dashboard → Manage Events
   - You'll see all events organized by status (Upcoming, Ongoing, Completed)

2. **Generate Report**
   - Click the "📊 Report" button on any event card
   - Confirm the action in the popup dialog
   - Wait for the report to be generated (button shows "Sending...")

3. **Confirmation**
   - You'll receive a success message when the report is sent
   - The organizer will receive the report at their registered email

### For Event Organizers:

1. **Receive Report**
   - Check the email address you provided during event creation
   - Look for an email with subject: "Event Report: [Your Event Name]"

2. **Review Report**
   - Open the email to see quick stats
   - Scroll down for the complete AI-generated analysis
   - Review recommendations for future improvements

## Technical Details

### API Endpoint
- **URL**: `/api/admin/generate-event-report`
- **Method**: POST
- **Body**: `{ eventId: "event-id-here" }`

### Data Collected
The report analyzes:
- Event information (title, date, location, capacity, etc.)
- All bookings with status breakdown
- User details (name, email, phone, tickets purchased)
- Revenue data by date
- Payment information
- Attendance statistics

### AI Processing
- Uses **Google Gemini AI** (gemini-1.5-flash model)
- Analyzes up to 50 user records for detailed insights
- Generates professional business-style reports
- Provides data-driven recommendations

### Email Service
- Sent via Gmail SMTP
- Professional HTML formatting
- Includes both summary and detailed analysis
- Branded with EventHub styling

## Requirements

### Environment Variables
Ensure these are set in `.env.local`:
```env
GEMINI_API_KEY="your-gemini-api-key"
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
```

### Event Requirements
- Event must have an `organizerEmail` field set
- This email is set during event creation

## Error Handling

### Common Issues:

1. **"Organizer email not found"**
   - Solution: Edit the event and add an organizer email

2. **"Failed to send email"**
   - Check Gmail credentials in `.env.local`
   - Ensure Gmail App Password is valid
   - Check internet connection

3. **"Failed to generate report"**
   - Check Gemini API key is valid
   - Ensure API quota is not exceeded
   - Check event has booking data

## Security

- Only SUPER_ADMIN role can generate reports
- Email sent only to the registered organizer email
- User data is processed securely
- No data is stored during report generation

## Performance

- Report generation takes 5-15 seconds depending on data volume
- Processes up to 50 user records for AI analysis
- All bookings are included in statistics
- Email delivery is asynchronous

## Future Enhancements

Potential improvements:
- PDF attachment option
- Scheduled automatic reports
- Custom report templates
- Multi-language support
- Export to Excel/CSV
- Historical report comparison

## Support

For issues or questions:
- Check the browser console for error messages
- Verify all environment variables are set
- Ensure the event has an organizer email
- Contact system administrator if problems persist

---

**Last Updated**: November 2025
**Version**: 1.0.0
