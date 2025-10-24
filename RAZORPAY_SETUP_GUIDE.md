# Razorpay Integration Setup Guide

## 🚀 Complete Razorpay Payment Integration for EventHub

Your EventHub website now includes a complete Razorpay payment integration! Follow these steps to configure your live payment gateway.

## 📋 Prerequisites

1. **Razorpay Account**: You need a Razorpay business account
2. **Live API Keys**: Your live Key ID and Key Secret from Razorpay Dashboard
3. **Environment Configuration**: Update your `.env.local` file

## 🔑 Step 1: Configure Razorpay API Keys

1. **Login to Razorpay Dashboard**: https://dashboard.razorpay.com/
2. **Navigate to Settings → API Keys**
3. **Generate Live Keys** (if not already generated)
4. **Update your `.env.local` file**:

```env
# Replace with your actual Razorpay live keys
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_secret_key_here"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxx"
```

⚠️ **Important**:

- Use `rzp_test_` keys for testing
- Use `rzp_live_` keys for production
- Never commit secret keys to version control

## 📋 Step 2: Test the Integration

### Test Flow:

1. **User fills booking form** → Proceeds to payment
2. **Razorpay order created** → Payment modal opens
3. **User completes payment** → Payment verification happens
4. **Success/Failure handled** → Tickets generated and emailed

### Test Scenarios:

1. **Successful Payment**: User gets confirmed booking + email ticket
2. **Failed Payment**: User sees error message and can retry
3. **Payment Modal Dismissed**: User returns to booking form

## 🛡️ Step 3: Security Features Included

✅ **Payment Signature Verification**: Server-side signature validation
✅ **Order Amount Validation**: Prevents amount tampering
✅ **Booking Status Tracking**: PENDING → CONFIRMED/FAILED
✅ **Duplicate Prevention**: Each order can only be paid once
✅ **Capacity Checking**: Prevents overbooking events

## 📧 Step 4: Email Integration

When payment is successful:

1. **Booking status** updated to CONFIRMED
2. **Ticket image** generated automatically
3. **Email sent** with ticket attachment
4. **User can view ticket** in My Events section

## 🔄 Payment Flow Architecture

```
User Form Submission
       ↓
Create Razorpay Order (API)
       ↓
Open Razorpay Payment Modal
       ↓
User Completes Payment
       ↓
Verify Payment Signature (API)
       ↓
Update Booking Status
       ↓
Generate & Email Ticket
       ↓
Show Success Message
```

## 📱 Features Implemented

### Frontend (BookingModal.js):

- **Multi-step UI**: Form → Payment → Success/Failure
- **Razorpay Integration**: Official Razorpay checkout
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during processing

### Backend APIs:

- **`/api/payment/create-order`**: Creates Razorpay order
- **`/api/payment/verify`**: Verifies payment and confirms booking
- **`/api/payment/status/[bookingId]`**: Check payment status

### Database Schema:

```sql
bookings table includes:
- razorpayOrderId: Links to Razorpay order
- paymentId: Razorpay payment ID after success
- status: PENDING/CONFIRMED/FAILED
- paymentVerifiedAt: Timestamp of successful payment
```

## 🧪 Testing Instructions

### 1. Test Mode Setup:

```env
# Use test keys for development
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"
RAZORPAY_KEY_SECRET="test_secret_key"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"
```

### 2. Razorpay Test Cards:

- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### 3. Test Process:

1. Create an event with price > 0
2. Try booking tickets
3. Use test card details
4. Verify booking confirmation
5. Check email delivery

## 🚀 Production Deployment

### 1. Environment Variables:

- Update all Razorpay keys to live keys
- Ensure email configuration is working
- Test with small amounts first

### 2. Razorpay Dashboard Settings:

- **Webhook URL**: Set up webhooks for payment updates
- **Payment Methods**: Enable desired payment methods
- **Settlement**: Configure auto-settlement

### 3. Go Live Checklist:

- [ ] Live Razorpay keys configured
- [ ] Test transactions successful
- [ ] Email delivery working
- [ ] Webhook endpoints set (optional)
- [ ] Payment failure handling tested
- [ ] Refund policy configured

## 📞 Support & Troubleshooting

### Common Issues:

1. **"Invalid Key" Error**:

   - Check if NEXT_PUBLIC_RAZORPAY_KEY_ID is correct
   - Ensure you're using the right key for test/live mode

2. **Payment Verification Failed**:

   - Verify RAZORPAY_KEY_SECRET is correct
   - Check server logs for signature mismatch

3. **Email Not Sent**:

   - Check Gmail configuration in `.env.local`
   - Verify SMTP settings are correct

4. **Booking Not Confirmed**:
   - Check database booking status
   - Review payment verification API logs

### Debug Mode:

- Check browser console for frontend errors
- Check server logs for backend errors
- Use `/api/payment/status/[bookingId]` to check payment status

## 🎯 Success Criteria

✅ **User Experience**: Smooth payment flow with clear feedback
✅ **Security**: All payments verified server-side
✅ **Reliability**: Failed payments don't create confirmed bookings
✅ **Email Integration**: Automatic ticket delivery
✅ **Admin Visibility**: All transactions tracked in database

**Your EventHub now has enterprise-grade payment processing! 🚀**

## 🔗 Useful Links

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Test Cards](https://razorpay.com/docs/payment-gateway/test-card-upi-details/)
- [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [Webhook Setup Guide](https://razorpay.com/docs/webhooks/)
