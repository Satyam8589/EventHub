# Payment Lookup Feature - Super Admin Dashboard

## 🎯 Overview
Added a comprehensive Payment Lookup feature to the Super Admin dashboard that allows admins to search for complete user and payment details by entering a Payment ID.

## ✨ Features

### 1. **Search Functionality**
- Search by Payment ID (e.g., `pay_R1PRyMm1JAo2VA`)
- Real-time search with loading states
- Error handling for invalid/not found payment IDs

### 2. **Comprehensive Data Display**

#### 👤 User Information
- Name, Email, Phone
- User Role
- Account creation date

#### 📊 User Statistics
- Total bookings count
- Confirmed bookings count
- Total amount spent
- Ticket scans count

#### 🎫 Booking Details
- Booking ID
- Status (CONFIRMED, PENDING, FAILED)
- Payment ID
- Amount paid
- Number of tickets
- Booking creation date

#### 🎉 Event Details
- Event title
- Event date and time
- Location
- Category

#### 🔔 Webhook Tracking
- Verification attempts count
- Last verification timestamp
- Webhook received timestamp
- Webhook processed timestamp

#### 📝 Verification Logs Table
- Attempt number
- Source (client/webhook)
- Success status
- Response time
- Error messages
- Timestamps

#### 🌐 Webhook Events Table
- Event type
- Signature validation status
- Processing status
- Errors (if any)
- Received timestamps

#### 🎟️ Ticket Scans Table
- Scan dates
- Scan timestamps
- Scan status

#### 📋 Recent Bookings Table
- Last 10 bookings by the user
- Event names
- Booking status
- Amounts
- Payment IDs
- Dates

## 🛠️ Technical Implementation

### API Endpoint
**File:** `src/app/api/admin/payment-lookup/route.js`

- **Method:** GET
- **Query Param:** `paymentId`
- **Authentication:** Requires SUPER_ADMIN role
- **Returns:** Complete user and payment data with statistics

### UI Component
**File:** `src/components/admin/PaymentLookup.js`

- Modern, responsive design
- Real-time search
- Comprehensive data visualization
- Color-coded status badges
- Formatted dates (IST timezone)
- Formatted currency (INR)

### Styling
**File:** `src/components/admin/PaymentLookup.module.css`

- Gradient backgrounds
- Glassmorphism effects
- Responsive grid layouts
- Hover effects
- Mobile-optimized tables

## 🎨 Design Features

- **Modern UI:** Gradient headers, glassmorphism cards
- **Color Coding:** Status badges (green for confirmed, yellow for pending, red for failed)
- **Responsive:** Works on all screen sizes
- **Accessible:** Clear labels, good contrast
- **Professional:** Clean typography, consistent spacing

## 🔒 Security

- **Role-based Access:** Only SUPER_ADMIN can access
- **Server-side Validation:** All checks done on backend
- **Secure Queries:** Uses Supabase RLS policies
- **Error Handling:** Graceful error messages

## 📊 Data Sources

The feature aggregates data from multiple tables:
- `bookings` - Main booking information
- `users` - User profile data
- `events` - Event details
- `payment_verification_log` - Verification attempts
- `webhook_events` - Webhook processing logs
- `ticket_scans` - Ticket scanning history
- `push_subscriptions` - Notification preferences

## 🚀 Usage

1. Navigate to Super Admin Dashboard
2. Scroll to "Payment Lookup" section
3. Enter a Payment ID (e.g., from Razorpay dashboard or booking records)
4. Click "Search"
5. View complete user and payment details

## 💡 Use Cases

- **Customer Support:** Quickly resolve payment issues
- **Fraud Detection:** Check verification logs and webhook events
- **User Analysis:** Understand user behavior and spending patterns
- **Debugging:** Trace payment flow from creation to confirmation
- **Audit Trail:** Complete history of all payment-related activities

## 📈 Benefits

- ✅ **Instant Access:** No need to query database manually
- ✅ **Complete View:** All related data in one place
- ✅ **Time Saving:** Reduces support response time
- ✅ **Professional:** Clean, organized presentation
- ✅ **Actionable:** Easy to identify and resolve issues

## 🔄 Future Enhancements

Potential additions:
- Export data to CSV/PDF
- Refund processing
- Email user directly
- Add notes/comments
- Search by booking ID, email, or phone
- Date range filters
- Advanced analytics

---

**Created:** 2025-11-29  
**Status:** ✅ Ready for Production
