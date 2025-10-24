# 🚨 URGENT: Database Migration Required for Razorpay Integration

## ❌ Current Issue

The payment system is failing because the `bookings` table is missing required columns for Razorpay integration.

**Error**: `Could not find the 'razorpayOrderId' column of 'bookings' in the schema cache`

## 🔧 **IMMEDIATE FIX REQUIRED**

### Step 1: Run Database Migration

1. **Open your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to your project**: `wasrwhlzzmxqwiwwxtxe`
3. **Go to SQL Editor** (left sidebar)
4. **Create a new query** and paste this SQL:

```sql
-- Add Razorpay payment fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS razorpayOrderId TEXT,
ADD COLUMN IF NOT EXISTS paymentVerifiedAt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failureReason TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON bookings(razorpayOrderId);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_verified_at ON bookings(paymentVerifiedAt);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Update existing bookings to have a default status if needed
UPDATE bookings SET status = 'CONFIRMED' WHERE status IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
```

5. **Click "Run"** to execute the migration
6. **Verify** that the new columns are added

### Step 2: Update Payment API (After Migration)

Once the database migration is complete, I need to update the payment APIs to use the proper `razorpayOrderId` column instead of the temporary workaround.

## 🎯 **Current Temporary Workaround**

I've temporarily modified the code to store the Razorpay order ID in the `paymentId` field with a `PENDING_` prefix until the migration is complete:

- **Order Creation**: Stores `PENDING_order_xyz123` in `paymentId`
- **Payment Verification**: Looks for bookings with `paymentId = PENDING_order_xyz123`
- **Confirmation**: Updates `paymentId` to actual payment ID

## ⚡ **After Migration Steps**

Once you run the SQL migration:

1. **Confirm Migration Success**: The SQL should show the new columns
2. **Restart Development Server**: `npm run dev`
3. **Test Payment Flow**: Try booking an event
4. **Notify me**: I'll update the APIs to use proper columns

## 🧪 **Test the Current Fix**

Even with the temporary workaround, the payment should now work:

1. **Start server**: `npm run dev`
2. **Go to any event**: Click "Book Now"
3. **Fill booking form**: Enter your details
4. **Proceed to Payment**: Razorpay modal should open
5. **Complete payment**: With test card or real payment

## 📊 **Database Schema Before & After**

### Before Migration:

```
bookings table:
- id, userId, eventId, tickets, totalAmount
- status, paymentMethod, paymentId
- createdAt, updatedAt
```

### After Migration:

```
bookings table:
- id, userId, eventId, tickets, totalAmount
- status, paymentMethod, paymentId
- razorpayOrderId (NEW)
- paymentVerifiedAt (NEW)
- failureReason (NEW)
- createdAt, updatedAt
```

## 🔄 **Migration Priority**

**HIGH PRIORITY**: This migration is required for:

- ✅ Proper payment tracking
- ✅ Payment verification security
- ✅ Refund management (future)
- ✅ Payment analytics
- ✅ Debugging payment issues

## 📞 **Next Steps**

1. **Run the SQL migration** in Supabase Dashboard
2. **Confirm it worked** (check for new columns)
3. **Test payment flow** with the temporary fix
4. **Let me know** when migration is complete so I can update the APIs

The payment system will work with the temporary fix, but the proper database schema is essential for production use.

---

**Need help with the migration? The SQL code is in `supabase-migration-razorpay.sql` file.**
