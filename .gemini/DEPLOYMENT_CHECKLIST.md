# Payment System Deployment Checklist

## 🎯 Overview
Use this checklist to ensure smooth deployment of the payment system improvements.

---

## 📋 Pre-Deployment Checklist

### 1. Code Review ✅
- [ ] Review changes in `src/components/RazorpayPayment.js`
- [ ] Review changes in `src/app/api/payment/verify/route.js`
- [ ] Review new file `src/app/api/payment/webhook/route.js`
- [ ] Verify all imports are correct
- [ ] Check for any console.log statements to remove (optional)
- [ ] Ensure no hardcoded values

### 2. Database Migration ✅
- [ ] Review `supabase_migrations/payment_verification_tracking.sql`
- [ ] Test migration on development database
- [ ] Verify tables created successfully:
  - [ ] `payment_verification_log`
  - [ ] `webhook_events`
- [ ] Verify columns added to `bookings` table:
  - [ ] `verification_attempts`
  - [ ] `last_verification_attempt`
  - [ ] `webhook_received_at`
  - [ ] `webhook_processed_at`
- [ ] Test `log_verification_attempt()` function
- [ ] Verify indexes created
- [ ] Check permissions granted

### 3. Environment Variables ✅
- [ ] `RAZORPAY_KEY_ID` is set
- [ ] `RAZORPAY_KEY_SECRET` is set
- [ ] `RAZORPAY_WEBHOOK_SECRET` is set (if using webhooks)
- [ ] All environment variables are in `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] Production environment variables configured on hosting platform

### 4. Webhook Configuration (Optional but Recommended) ✅
- [ ] Log in to Razorpay Dashboard
- [ ] Navigate to Settings → Webhooks
- [ ] Create new webhook with:
  - [ ] URL: `https://your-domain.com/api/payment/webhook`
  - [ ] Events: `payment.captured`, `payment.failed`
  - [ ] Active: Yes
- [ ] Copy webhook secret
- [ ] Add webhook secret to environment variables
- [ ] Test webhook with "Send Test Webhook" in dashboard

### 5. Local Testing ✅
- [ ] Start development server
- [ ] Test normal payment flow
- [ ] Test with test card: `4111 1111 1111 1111`
- [ ] Verify booking created
- [ ] Verify email sent
- [ ] Check database for verification log entry
- [ ] Test retry mechanism (simulate network failure)
- [ ] Test idempotency (call verify API twice)
- [ ] Check console logs for errors

---

## 🚀 Deployment Steps

### Step 1: Backup Current System ✅
- [ ] Backup production database
- [ ] Tag current code version in git
- [ ] Document current environment variables
- [ ] Save current Razorpay webhook configuration

### Step 2: Deploy Database Migration ✅
- [ ] Connect to production database
- [ ] Run migration SQL:
  ```sql
  -- Copy and execute: supabase_migrations/payment_verification_tracking.sql
  ```
- [ ] Verify tables created:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_name IN ('payment_verification_log', 'webhook_events');
  ```
- [ ] Verify columns added:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'bookings' 
  AND column_name IN ('verification_attempts', 'webhook_received_at');
  ```
- [ ] Test function exists:
  ```sql
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_name = 'log_verification_attempt';
  ```

### Step 3: Deploy Code Changes ✅
- [ ] Commit all changes to git
- [ ] Push to repository
- [ ] Deploy to staging environment (if available)
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Check application logs for errors

### Step 4: Configure Production Webhook ✅
- [ ] Update webhook URL to production domain
- [ ] Verify webhook is active
- [ ] Test webhook delivery:
  - [ ] Use "Send Test Webhook" in Razorpay dashboard
  - [ ] Check server logs for webhook receipt
  - [ ] Verify signature validation passes
- [ ] Monitor webhook deliveries in Razorpay dashboard

### Step 5: Verify Deployment ✅
- [ ] Access production application
- [ ] Test payment flow end-to-end
- [ ] Verify booking created
- [ ] Verify email sent
- [ ] Check database for verification log
- [ ] Check webhook events table
- [ ] Monitor server logs for errors

---

## 🧪 Post-Deployment Testing

### Test Scenario 1: Normal Payment ✅
**Steps**:
1. Book a ticket with test card
2. Complete payment
3. Wait for verification

**Expected**:
- [ ] Payment completes in 2-3 seconds
- [ ] Success message shown
- [ ] Redirected to My Events
- [ ] Ticket appears in My Events
- [ ] Email received
- [ ] Database shows CONFIRMED status
- [ ] Verification log shows success

### Test Scenario 2: Webhook Verification ✅
**Steps**:
1. Make a test payment
2. Check webhook events in Razorpay dashboard
3. Check server logs

**Expected**:
- [ ] Webhook received within 5 seconds
- [ ] Signature validation passes
- [ ] Booking confirmed
- [ ] Email sent
- [ ] Database shows webhook timestamp

### Test Scenario 3: Retry Mechanism ✅
**Steps**:
1. Simulate slow network (DevTools)
2. Make payment
3. Watch console logs

**Expected**:
- [ ] Retry attempts logged
- [ ] Exponential backoff visible
- [ ] Eventually succeeds
- [ ] Ticket delivered

### Test Scenario 4: Idempotency ✅
**Steps**:
1. Complete payment
2. Call verify API again manually
3. Check response

**Expected**:
- [ ] Second call returns success
- [ ] Response includes `alreadyProcessed: true`
- [ ] No duplicate ticket
- [ ] No duplicate email

### Test Scenario 5: Concurrent Bookings ✅
**Steps**:
1. Create event with capacity = 2
2. Open two browser windows
3. Book simultaneously

**Expected**:
- [ ] Both payments succeed
- [ ] Both bookings confirmed
- [ ] Total bookings = 2
- [ ] No overselling

---

## 📊 Monitoring Setup

### 1. Set Up Monitoring Queries ✅
Save these queries for regular monitoring:

**Verification Success Rate**:
```sql
SELECT 
  verification_source,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM payment_verification_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY verification_source;
```
- [ ] Success rate > 99%

**Recent Failures**:
```sql
SELECT booking_id, error_message, created_at
FROM payment_verification_log
WHERE success = false
ORDER BY created_at DESC
LIMIT 10;
```
- [ ] Very few or no failures

**Webhook Delivery**:
```sql
SELECT 
  event_type,
  COUNT(*) as total,
  SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processed
FROM webhook_events
WHERE received_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type;
```
- [ ] All webhooks processed

### 2. Set Up Alerts ✅
Configure alerts for:
- [ ] Verification success rate < 95%
- [ ] Webhook delivery failures
- [ ] Average verification time > 5 seconds
- [ ] Any signature verification failures

### 3. Dashboard Setup ✅
Create monitoring dashboard with:
- [ ] Real-time verification success rate
- [ ] Average verification time
- [ ] Webhook delivery status
- [ ] Recent failures list
- [ ] Payment volume chart

---

## 🔍 Health Checks

### Immediate (First Hour) ✅
- [ ] Check server logs every 15 minutes
- [ ] Monitor verification success rate
- [ ] Watch for any errors
- [ ] Verify webhook deliveries
- [ ] Check email delivery

### Short-term (First 24 Hours) ✅
- [ ] Run monitoring queries every 4 hours
- [ ] Check success rate > 99%
- [ ] Verify no overselling
- [ ] Monitor response times
- [ ] Review error logs

### Long-term (First Week) ✅
- [ ] Daily monitoring query review
- [ ] Weekly success rate analysis
- [ ] Performance trend analysis
- [ ] User feedback review
- [ ] Support ticket analysis

---

## 🆘 Rollback Plan

### If Critical Issues Occur ✅

**Indicators for Rollback**:
- Verification success rate < 80%
- Overselling detected
- Critical bugs affecting payments
- Database errors

**Rollback Steps**:
1. [ ] Revert code to previous version
2. [ ] Restore database backup (if needed)
3. [ ] Restore previous webhook configuration
4. [ ] Verify old system working
5. [ ] Notify team of rollback
6. [ ] Investigate issues
7. [ ] Fix and redeploy when ready

**Rollback Commands**:
```bash
# Revert to previous git tag
git checkout <previous-tag>

# Rebuild and redeploy
npm run build
# Deploy to hosting platform
```

---

## 📝 Documentation Updates

### Update Documentation ✅
- [ ] Update main README with new features
- [ ] Document webhook setup in team wiki
- [ ] Add troubleshooting guide to support docs
- [ ] Update API documentation
- [ ] Create runbook for on-call team

### Team Communication ✅
- [ ] Notify team of deployment
- [ ] Share monitoring dashboard
- [ ] Provide quick reference guide
- [ ] Schedule team demo/walkthrough
- [ ] Document lessons learned

---

## ✅ Success Criteria

Deployment is successful when:
- [ ] All tests pass
- [ ] Verification success rate > 99%
- [ ] Average verification time < 3 seconds
- [ ] Webhook delivery rate > 95%
- [ ] No overselling incidents
- [ ] No duplicate tickets
- [ ] Email delivery working
- [ ] Monitoring dashboard active
- [ ] Team trained on new system
- [ ] Documentation complete

---

## 📞 Support Contacts

### During Deployment
- **Deployment Lead**: [Name]
- **Database Admin**: [Name]
- **DevOps**: [Name]
- **On-Call Engineer**: [Name]

### Post-Deployment
- **Support Team**: [Email/Slack]
- **Development Team**: [Email/Slack]
- **Razorpay Support**: support@razorpay.com

---

## 🎉 Deployment Complete!

Once all items are checked:
- [ ] Mark deployment as complete
- [ ] Send success notification to team
- [ ] Schedule post-deployment review
- [ ] Document any issues encountered
- [ ] Update deployment runbook
- [ ] Celebrate! 🎊

---

## 📅 Post-Deployment Schedule

### Day 1
- Monitor every hour
- Check all metrics
- Respond to any issues immediately

### Week 1
- Daily monitoring
- Review success rates
- Analyze user feedback
- Fix any minor issues

### Week 2-4
- Weekly monitoring
- Performance analysis
- Optimization opportunities
- Plan next improvements

---

## 📊 Metrics to Track

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Verification Success Rate | >99% | ___ | ⬜ |
| Avg Verification Time | <3s | ___ | ⬜ |
| Webhook Delivery Rate | >95% | ___ | ⬜ |
| Email Delivery Rate | >99% | ___ | ⬜ |
| Overselling Incidents | 0 | ___ | ⬜ |
| Duplicate Tickets | 0 | ___ | ⬜ |
| Support Tickets | <5/day | ___ | ⬜ |

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Verified By**: _______________
**Status**: ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back
