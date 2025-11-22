# Event Report Generation - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN INTERFACE                        │
│                     (Admin Events Management Page)                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1. Click "📊 Report" button
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND HANDLER                             │
│                    handleGenerateReport(eventId)                     │
│                                                                       │
│  • Shows confirmation dialog                                         │
│  • Sets loading state                                                │
│  • Makes API call                                                    │
│  • Shows success/error message                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 2. POST request with eventId
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API ENDPOINT (Backend)                            │
│            /api/admin/generate-event-report/route.js                 │
│                                                                       │
│  Step 1: Validate eventId                                            │
│  Step 2: Fetch event data from database ────────────┐                │
│  Step 3: Fetch all bookings with user info          │                │
│  Step 4: Calculate comprehensive analytics          │                │
│  Step 5: Prepare data for AI analysis               │                │
│  Step 6: Send to Gemini AI for report generation    │                │
│  Step 7: Generate email HTML                        │                │
│  Step 8: Send email to organizer                    │                │
└─────────────────────────────────────────────────────┼────────────────┘
                                    │                 │
                    ┌───────────────┼─────────────────┘
                    │               │
                    │               │ 3. Query database
                    │               ▼
                    │   ┌─────────────────────────┐
                    │   │   SUPABASE DATABASE     │
                    │   │                         │
                    │   │  • events table         │
                    │   │  • bookings table       │
                    │   │  • users table          │
                    │   └─────────────────────────┘
                    │
                    │ 4. Send data for analysis
                    ▼
        ┌─────────────────────────┐
        │   GOOGLE GEMINI AI      │
        │   (gemini-1.5-flash)    │
        │                         │
        │  • Analyzes event data  │
        │  • Generates insights   │
        │  • Creates HTML report  │
        │  • Provides recommendations │
        └─────────────────────────┘
                    │
                    │ 5. Return formatted report
                    ▼
        ┌─────────────────────────┐
        │   EMAIL SERVICE         │
        │   (Gmail SMTP)          │
        │                         │
        │  • Formats email        │
        │  • Adds branding        │
        │  • Sends to organizer   │
        └─────────────────────────┘
                    │
                    │ 6. Email delivered
                    ▼
        ┌─────────────────────────┐
        │   ORGANIZER'S EMAIL     │
        │                         │
        │  📧 Professional Report │
        │  • Quick stats          │
        │  • Full analysis        │
        │  • User details         │
        │  • Recommendations      │
        └─────────────────────────┘
```

---

## Data Flow Details

### 1. Event Data Collection
```
Supabase Database
├── events
│   ├── id, title, description
│   ├── date, endDate, time
│   ├── location, venue
│   ├── capacity, price
│   └── organizerEmail ← Target for report
│
├── bookings
│   ├── id, eventId, userId
│   ├── tickets, totalAmount
│   ├── status (CONFIRMED/PENDING/FAILED)
│   ├── paymentId
│   └── createdAt
│
└── users
    ├── id, name, email
    └── phone
```

### 2. Analytics Calculation
```
Raw Data → Processing → Analytics
├── Total Bookings
├── Confirmed/Pending/Failed breakdown
├── Total Revenue
├── Total Tickets Sold
├── Unique Attendees
├── Capacity Utilization %
├── Average Tickets per Booking
├── Average Revenue per Booking
└── Revenue by Date
```

### 3. AI Processing
```
Input Data (JSON)
    ↓
Gemini AI Prompt
    ↓
AI Analysis
    ↓
Professional HTML Report
├── Executive Summary
├── Event Details
├── Booking Analytics
├── Financial Performance
├── Attendee Insights
└── Recommendations
```

### 4. Email Composition
```
Report HTML
    +
Email Template
    +
Quick Stats
    +
EventHub Branding
    ↓
Complete Email
    ↓
Gmail SMTP
    ↓
Organizer's Inbox
```

---

## Component Interaction

```
┌──────────────────┐
│  Admin Events    │
│  Page Component  │
│                  │
│  State:          │
│  • events[]      │
│  • reportGen{}   │◄─── Tracks loading state per event
│                  │
│  Functions:      │
│  • handleGen()   │◄─── Calls API endpoint
└──────────────────┘
         │
         │ API Call
         ▼
┌──────────────────┐
│  API Route       │
│  (Server-side)   │
│                  │
│  Uses:           │
│  • supabase      │◄─── Database queries
│  • genAI         │◄─── AI analysis
│  • sendEmail()   │◄─── Email delivery
└──────────────────┘
```

---

## Security Flow

```
User Request
    ↓
Check: Is user SUPER_ADMIN? ──No──► Reject (403)
    ↓ Yes
Validate eventId ──Invalid──► Error (400)
    ↓ Valid
Check: Event exists? ──No──► Error (404)
    ↓ Yes
Check: Has organizer email? ──No──► Error (400)
    ↓ Yes
Generate Report
    ↓
Send ONLY to organizer email
    ↓
Return success
```

---

## Error Handling Flow

```
Try {
    Fetch Event ──Fail──► Return 404
        ↓ Success
    Fetch Bookings ──Fail──► Return 500
        ↓ Success
    Generate AI Report ──Fail──► Return 500
        ↓ Success
    Send Email ──Fail──► Return 500 + Details
        ↓ Success
    Return 200 + Success Message
}
Catch (error) {
    Log error
    Return 500 + Error details
}
```

---

## Performance Considerations

```
Event with 100 bookings:
├── Database Query: ~500ms
├── Data Processing: ~200ms
├── AI Generation: ~5-10s
├── Email Sending: ~1-2s
└── Total: ~7-13 seconds

Event with 500 bookings:
├── Database Query: ~1s
├── Data Processing: ~500ms
├── AI Generation: ~8-15s (limited to 50 users)
├── Email Sending: ~1-2s
└── Total: ~10-18 seconds
```

---

## File Structure

```
EventHub/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── events/
│   │   │       └── page.js ◄─── Frontend (Report button)
│   │   └── api/
│   │       └── admin/
│   │           └── generate-event-report/
│   │               └── route.js ◄─── Backend API
│   └── lib/
│       └── email.js ◄─── Email service
└── docs/
    ├── EVENT_REPORT_FEATURE.md
    ├── SUPER_ADMIN_REPORT_GUIDE.md
    ├── IMPLEMENTATION_SUMMARY.md
    └── ARCHITECTURE_DIAGRAM.md ◄─── This file
```

---

**Created**: November 2025  
**Version**: 1.0.0
