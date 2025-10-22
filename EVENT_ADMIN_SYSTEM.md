# Event Admin Assignment System

This document describes the comprehensive event admin assignment system with QR code ticket verification functionality implemented in EventHub.

## System Overview

The EventHub platform now supports a sophisticated role-based access control system with the following roles:

- **SUPER_ADMIN**: Full platform control, can create events and assign event admins
- **EVENT_ADMIN**: Can be assigned to specific events for ticket verification
- **ATTENDEE**: Regular users who can book tickets

## Key Features

### 1. Event Admin Assignment Rules

- **Maximum 2 admins per event**: Each event can have at most 2 assigned event admins
- **One event per admin**: Users can only be assigned as admin to one event at a time
- **Super admin assignment**: Only super admins can assign/remove event admins
- **Automatic role management**: Users get EVENT_ADMIN role when assigned, reverts to ATTENDEE when removed

### 2. QR Code Ticket Verification

- **Booking ID scanning**: Event admins scan booking IDs to verify tickets
- **Real-time validation**: Immediate verification with detailed feedback
- **Duplicate prevention**: Cannot verify the same booking twice
- **Statistics tracking**: Real-time stats on verified vs total bookings

### 3. Database Schema

#### EventAdmin Model

```prisma
model EventAdmin {
  id         String   @id @default(cuid())
  userId     String   @unique // User can only admin one event
  eventId    String
  assignedBy String
  assignedAt DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event      Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  assignedByUser User  @relation("AssignedEventAdmins", fields: [assignedBy], references: [id])

  @@unique([userId]) // Ensures user can only be admin of one event
}
```

#### TicketVerification Model

```prisma
model TicketVerification {
  id        String   @id @default(cuid())
  bookingId String   @unique // Prevents duplicate verification
  scannedBy String
  eventId   String
  scannedAt DateTime @default(now())
  isValid   Boolean  @default(true)
  notes     String?

  booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  scanner   User     @relation(fields: [scannedBy], references: [id], onDelete: Cascade)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Event Admin Management

#### 1. Assign Event Admin

**POST** `/api/admin/events/[id]/admins`

```javascript
{
  "userId": "user_id_to_assign"
}
```

**Response:**

```javascript
{
  "success": true,
  "message": "Event admin assigned successfully",
  "eventAdmin": { ... }
}
```

#### 2. Get Event Admins

**GET** `/api/admin/events/[id]/admins`

**Response:**

```javascript
{
  "success": true,
  "admins": [
    {
      "id": "admin_id",
      "userId": "user_id",
      "user": { "name": "John Doe", "email": "john@example.com" },
      "assignedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 3. Remove Event Admin

**DELETE** `/api/admin/events/[id]/admins/[adminId]`

### QR Code Scanning

#### 1. Scan Ticket

**POST** `/api/admin/scan-ticket`

```javascript
{
  "bookingId": "booking_abc123",
  "scannedBy": "admin_user_id",
  "eventId": "event_id"
}
```

**Response (Success):**

```javascript
{
  "success": true,
  "message": "Ticket verified successfully",
  "booking": {
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "eventTitle": "Conference 2024",
    "tickets": 2,
    "verifiedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Response (Error):**

```javascript
{
  "success": false,
  "error": "BOOKING_NOT_FOUND",
  "message": "Booking not found"
}
```

#### 2. Get Scan Statistics

**GET** `/api/admin/scan-ticket?eventId=event_id&scannerId=user_id`

**Response:**

```javascript
{
  "success": true,
  "statistics": {
    "totalBookings": 150,
    "verifiedBookings": 89,
    "pendingVerification": 61,
    "totalTickets": 234
  },
  "recentVerifications": [
    {
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "tickets": 3,
      "verifiedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### User Search

#### Search Users for Admin Assignment

**GET** `/api/admin/users/search?query=john`

**Response:**

```javascript
{
  "success": true,
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ATTENDEE",
      "isEligible": true
    }
  ]
}
```

## User Interface Components

### 1. Event Admin Management (`/admin/events/[id]/admins`)

- **Access**: Super admins only
- **Features**:
  - Search users to assign as event admins
  - View current event admins
  - Remove event admins
  - Real-time validation of assignment rules

### 2. QR Code Scanner (`/admin/scanner`)

- **Access**: Event admins only
- **Features**:
  - Select assigned events (if admin of multiple)
  - Manual booking ID entry
  - QR camera placeholder (ready for camera integration)
  - Real-time statistics dashboard
  - Recent verifications list
  - Detailed scan results with booking information

### 3. QR Code Test Page (`/admin/qr-test`)

- **Access**: Super admins only
- **Features**:
  - Generate test QR codes for development
  - Download QR codes as images
  - Test with predefined booking IDs

## Validation Rules

### Event Admin Assignment

1. **Maximum capacity**: Each event can have at most 2 admins
2. **Exclusivity**: Users can only be admin of one event at a time
3. **Role inheritance**: Users must be ATTENDEE to become EVENT_ADMIN
4. **Super admin only**: Only SUPER_ADMIN users can assign/remove event admins

### Ticket Verification

1. **Authorization**: Only assigned event admins can scan for their events
2. **Booking validation**: Booking must exist and belong to the event
3. **Duplicate prevention**: Same booking cannot be verified twice
4. **Event matching**: Booking must be for the event being scanned

## Error Handling

### Common Error Codes

- `MAX_ADMINS_REACHED`: Event already has 2 admins
- `USER_ALREADY_ADMIN`: User is already admin of another event
- `USER_NOT_FOUND`: User doesn't exist
- `EVENT_NOT_FOUND`: Event doesn't exist
- `BOOKING_NOT_FOUND`: Booking doesn't exist
- `UNAUTHORIZED_SCANNER`: User not authorized to scan for this event
- `ALREADY_VERIFIED`: Booking already verified
- `WRONG_EVENT`: Booking not for this event

## Security Features

### Database Constraints

- Unique constraint on `EventAdmin.userId` prevents multiple event assignments
- Unique constraint on `TicketVerification.bookingId` prevents duplicate scans
- Cascade deletes ensure data consistency

### Access Control

- Role-based access control at API and UI levels
- Event-specific admin authorization for scanning
- Super admin privilege validation for admin management

### Audit Trail

- All admin assignments tracked with `assignedBy` and `assignedAt`
- All ticket verifications logged with scanner and timestamp
- Comprehensive logging for debugging and analytics

## Usage Workflow

### For Super Admins

1. Create events through the admin dashboard
2. Navigate to "Manage Events" → Select event → "Admins"
3. Search and assign up to 2 users as event admins
4. Monitor event statistics and admin activity

### For Event Admins

1. Log in and access the "Ticket Scanner" from the dashboard
2. Select your assigned event (auto-selected if only one)
3. Scan QR codes or manually enter booking IDs
4. View real-time verification statistics
5. Monitor recent verifications and event details

### For Development/Testing

1. Access "QR Test" page as super admin
2. Generate test QR codes with booking IDs
3. Use generated codes to test scanner functionality
4. Verify error handling with invalid booking IDs

## Technical Implementation

### Database Migration

The system includes a database migration that adds unique constraints:

```sql
-- Migration: 20251022224028_add_event_admin_constraints
-- Adds unique constraints for event admin assignment rules
```

### API Architecture

- **RESTful design**: Standard HTTP methods for CRUD operations
- **Async/await**: Modern JavaScript async handling
- **Error responses**: Consistent error format across all endpoints
- **Input validation**: Comprehensive validation of all request parameters
- **Next.js 15+ compatibility**: Async params handling throughout

### Frontend Components

- **React hooks**: Modern state management with useState/useEffect
- **Context API**: Authentication state management
- **Responsive design**: Mobile-friendly interface
- **Real-time updates**: Automatic refresh of statistics after scans

This comprehensive system provides secure, scalable event admin management with robust ticket verification capabilities.
