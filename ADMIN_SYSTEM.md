# EventHub Admin System

## 🎯 Overview

EventHub now includes a comprehensive admin system with role-based access control:

- **Super Admin**: Full platform control - create/edit events, manage discounts, assign admins
- **Event Admin**: Event-specific access - scan tickets, verify attendees (max 2 per event)
- **Regular Users**: Standard event browsing and booking

## 🔐 User Roles

### Super Admin (`SUPER_ADMIN`)

**Capabilities:**

- Create and edit all events
- Manage event images and details
- Create discount codes for events
- Assign up to 2 Event Admins per event
- View all analytics and revenue data
- Full platform management

**Access:**

- Admin Dashboard: `/admin`
- Event Management: `/admin/events`
- User Management: `/admin/users`
- Analytics: `/admin/analytics`

### Event Admin (`EVENT_ADMIN`)

**Capabilities:**

- Scan and verify tickets via QR codes
- View assigned events only
- Access event-specific data
- Verify attendee entry at events

**Access:**

- Admin Dashboard: `/admin` (limited view)
- Ticket Scanner: `/admin/scanner`
- Assigned Events: `/admin/events` (filtered)

### Regular User (`ATTENDEE`)

**Capabilities:**

- Browse and book events
- View digital tickets with QR codes
- Standard user interface

## 🚀 Getting Started

### 1. Create Admin Users in Firebase

First, create admin accounts in Firebase Authentication:

```bash
# Super Admin
Email: admin@eventhub.com
Password: [your choice]

# Event Admin
Email: eventadmin@eventhub.com
Password: [your choice]
```

### 2. Database Setup

The admin system has been seeded with:

- Super Admin user (admin@eventhub.com)
- Event Admin user (eventadmin@eventhub.com)
- Sample events
- Admin assignments

### 3. Access Admin Panel

1. **Sign up/Sign in** with admin credentials
2. Look for **🛡️ Admin Panel** in the user menu
3. Access role-appropriate dashboard

## 📱 Ticket Verification Flow

### For Event Admins:

1. **Navigate to Scanner**: `/admin/scanner`
2. **Select Event**: Choose from assigned events
3. **Scan QR Code**: Use phone camera or manual entry
4. **Verify Result**: Get instant validation feedback

### QR Code Format:

- Contains: Booking ID
- Verification: Cross-references with event and booking status
- Security: Prevents duplicate scans

## 🎛️ Event Management (Super Admin)

### Create Events:

- Navigate to `/admin/events`
- Click "Create Event"
- Fill event details
- Upload images
- Set capacity and pricing

### Assign Admins:

- Max 2 Event Admins per event
- Admins get access to ticket scanner
- Automatic notification system

### Manage Discounts:

- Create percentage-based discount codes
- Set validity periods
- Limit usage counts
- Apply to specific events

## 🔧 Technical Implementation

### Database Schema:

- `EventAdmin`: Links users to events (many-to-many)
- `TicketVerification`: Tracks scanned tickets
- `EventDiscount`: Manages discount codes
- Enhanced `User` roles: `SUPER_ADMIN`, `EVENT_ADMIN`, `ATTENDEE`

### API Endpoints:

- `/api/admin/dashboard` - Dashboard stats
- `/api/admin/events` - Event management
- `/api/admin/verify-ticket` - Ticket verification
- Role-based access control on all endpoints

### Security Features:

- JWT-based authentication
- Role validation on every request
- Event-specific admin permissions
- Secure ticket verification

## 📊 Dashboard Features

### Super Admin Dashboard:

- Total events count
- Revenue analytics
- User management stats
- Recent activity feed

### Event Admin Dashboard:

- Assigned events only
- Booking statistics
- Verification history
- Quick scanner access

## 🎫 Digital Tickets

Users receive tickets with:

- QR codes for verification
- Complete event details
- Attendee information
- Download functionality

## 🔄 Workflow Example

1. **Super Admin** creates event
2. **Super Admin** assigns 2 Event Admins
3. **Users** book tickets → receive QR codes
4. **Event day**: Event Admins scan tickets at venue
5. **System** validates and records entry
6. **Prevents** duplicate entries and fraud

## 🚦 Access Control

- **Automatic role detection** from database
- **UI adapts** based on user role
- **Protected routes** with authentication
- **Graceful fallbacks** for unauthorized access

## 💡 Best Practices

1. **Always verify** admin credentials before role assignment
2. **Limit Event Admins** to 2 per event for security
3. **Regular audit** of admin permissions
4. **Monitor** ticket verification logs
5. **Update roles** in database when needed

---

**Ready to use!** The admin system is fully functional and ready for event management. 🎉
