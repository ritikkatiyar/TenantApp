# Tenant Hub Backend & Frontend Engineering Specification

**Author**: Senior Software Architect & Lead Frontend Engineer  
**Status**: Approved Specification  
**Version**: 1.0.0  
**Target Domain**: Tenant Portal (Mobile & Desktop)

---

## 1. Executive Summary & Architectural Principles

This document defines the production-grade engineering specification for building the **Tenant-Side Backend API** and aligning the **Tenant Frontend Application** (Mobile and Desktop views) in `TenantAppFE`.

### Core Engineering Standards Compliance ([ENGINEERING_STANDARDS.md](file:///d:/TenantApp/ENGINEERING_STANDARDS.md))
- **Architecture**: Modular Monolith organized by Domain / Bounded Contexts (`auth`, `user`, `property`, `finance`, `announcement`).
- **Domain-Prefixed REST API**: All endpoints follow `/api/v1/{domain}/tenant/...`.
- **Unified FAANG Response Envelope**:
  ```json
  {
    "success": true,
    "data": {},
    "error": null
  }
  ```
- **Database & Persistence Rules**:
  - Table naming: `snake_case` with `_tbl` suffix (`lease_tbl`, `maintenance_ticket_tbl`, `notice_tbl`, `inventory_item_tbl`).
  - Primary keys: `UUID` only.
  - Foreign keys: `*_id` naming convention.
  - Schema changes: Flyway migrations ONLY (`src/main/resources/db/migration/`).
- **Data Access & Performance Discipline**:
  - **Zero Database Calls in Loops**: Bulk fetching via `IN` queries (`findAllByXIn()`) and batch saves (`saveAll()`).
  - **Mandatory Pagination**: All dynamic list queries return `Page<T>` via Spring's `Pageable`.
  - **Decoupled CRUD Layer**: Business services interact through `CrudService<T, ID>` interface abstractions.

---

## 2. Frontend UX / Design Aura Analysis

The tenant frontend application matches the **Stitch Design System** featuring a high-end Glassmorphic visual aura across mobile and desktop viewports.

### Design Tokens & Visual Architecture
- **Primary Color Palette**: Deep Ocean Teal (`#004c5a` / `#006677`) accented with Cyan Glow (`#96e1f5` / `#aaedff`).
- **Background System**: Soft Arctic Ice to Lavender HSL gradient (`['#d4f5f9', '#e8f8fb', '#e2e0fb']`).
- **Glassmorphism**: Translucent `BlurView` cards (intensity: 45–60) with 1px `glassStroke` (`rgba(255, 255, 255, 0.65)`).
- **Inverse Contrast Card**: Used for Lease & Security details in Midnight Navy (`#213145`) with crisp `#ffffff` typography.
- **Typography & Motion**: Inter font family, bold stat badges, micro-animations (`FadeInUp`, `FadeOutDown`), and tactile Haptic feedback on actions.

### Viewport Adaptability Matrix

| Feature Screen | Mobile View (<900px) | Desktop View (≥900px) |
| :--- | :--- | :--- |
| **Tenant Home** | Floating bottom tab bar, stacked critical banners, vertical notice board feed. | Sticky top `DesktopNavBar`, 2-column bento grid (Left: Home summary, Right: Notice Board), max-width 1200px. |
| **Property & Lease** | Full-width mobile cards, collapsible amenities grid, quick action buttons. | Multi-column grid layout, side-by-side active lease terms and amenities matrix. |
| **Payments & History** | Hero monthly balance card, quick pay button, scrollable transaction list. | Dual-column layout (Left: Current cycle & payment gateway trigger, Right: Paginated history table). |
| **Service Center** | Vertical issue logger, image attachment uploader, ticket status timeline cards. | Split-screen workspace (Left: Issue logger form, Right: Live service health metrics & ticket tracker). |
| **Unit Inventory** | Read-only item condition cards, move-in photo links, amenity booking grid. | Multi-column bento snapshot card, assigned unit items, property-wide amenities catalog. |

---

## 3. Comprehensive API Specification Matrix

### 3.1 Identity & Me Context (`auth` & `user` Domains)

#### `GET /api/v1/auth/me/context`
- **Description**: Bootstraps tenant session and returns active home tenancy context.
- **Headers**: `Authorization: Bearer <token>`
- **Response `data`**:
  ```json
  {
    "user": {
      "id": "u-9812-uuid",
      "fullName": "Alex Mercer",
      "email": "alex@tenant.com",
      "roles": ["TENANT"]
    },
    "activeLeases": [
      {
        "leaseId": "l-1029-uuid",
        "propertyId": "p-5501-uuid",
        "propertyName": "Libsys Residential",
        "unitNumber": "101",
        "floorNumber": 4,
        "rentAmount": 10000.00,
        "status": "ACTIVE"
      }
    ]
  }
  ```

#### `GET /api/v1/user/tenant/profile`
- **Description**: Retrieves current tenant profile & emergency contacts.
- **Response `data`**:
  ```json
  {
    "userId": "u-9812-uuid",
    "fullName": "Alex Mercer",
    "phone": "+91-9876543210",
    "emergencyContactName": "Sarah Mercer",
    "emergencyContactPhone": "+91-9876500000"
  }
  ```

#### `PUT /api/v1/user/tenant/profile`
- **Description**: Updates tenant contact details.
- **Request Body**:
  ```json
  {
    "phone": "+91-9876543210",
    "emergencyContactName": "Sarah Mercer",
    "emergencyContactPhone": "+91-9876500000"
  }
  ```

---

### 3.2 Property & Lease Contracts (`property` & `finance` Domains)

#### `GET /api/v1/finance/tenant/leases/active`
- **Description**: Fetches comprehensive digital lease terms and security deposit status.
- **Response `data`**:
  ```json
  {
    "leaseId": "l-1029-uuid",
    "propertyName": "Libsys Residential",
    "unitNumber": "101",
    "floorNumber": 4,
    "wing": "Main Wing",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "monthlyRent": 10000.00,
    "securityDeposit": 30000.00,
    "securityDepositStatus": "LOCKED",
    "digitalLeaseAgreementUrl": "https://storage.tenantapp.com/leases/l-1029.pdf",
    "signedAt": "2023-12-15T10:30:00Z"
  }
  ```

#### `GET /api/v1/property/tenant/properties/{propertyId}/amenities`
- **Description**: Fetches common property amenities.
- **Response `data`**:
  ```json
  [
    { "id": "am-1", "name": "High-speed Wi-Fi", "category": "UTILITY", "icon": "wifi" },
    { "id": "am-2", "name": "Pool Access", "category": "RECREATION", "icon": "pool" },
    { "id": "am-3", "name": "Reserved Parking", "category": "PARKING", "icon": "local-parking" },
    { "id": "am-4", "name": "24/7 Gym", "category": "FITNESS", "icon": "fitness-center" }
  ]
  ```

---

### 3.3 Billing, Payments & Invoices (`finance` Domain)

#### `GET /api/v1/finance/tenant/rent-cycles/current`
- **Description**: Retrieves current billing cycle balance and due date breakdown.
- **Response `data`**:
  ```json
  {
    "cycleId": "rc-2023-10-uuid",
    "cycleMonth": "October 2023",
    "dueDate": "2023-10-05",
    "totalAmountDue": 10000.00,
    "status": "DUE",
    "breakdown": [
      { "description": "Base Monthly Rent", "amount": 10000.00 }
    ]
  }
  ```

#### `GET /api/v1/finance/tenant/payments`
- **Description**: Returns paginated payment history.
- **Query Params**: `page=0&size=10&status=SUCCESS`
- **Response `data`**:
  ```json
  {
    "content": [
      {
        "paymentId": "pay-9012-uuid",
        "transactionDate": "2023-09-01T09:15:00Z",
        "description": "Monthly Rent",
        "category": "RENT",
        "amount": 10000.00,
        "status": "SUCCESS",
        "invoiceUrl": "/api/v1/finance/tenant/payments/pay-9012-uuid/invoice"
      }
    ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 24,
    "totalPages": 3,
    "last": false
  }
  ```

#### `POST /api/v1/finance/tenant/payments/initiate`
- **Description**: Creates payment session token for payment gateway.
- **Request Body**:
  ```json
  {
    "cycleId": "rc-2023-10-uuid",
    "amount": 10000.00,
    "paymentMethod": "UPI"
  }
  ```
- **Response `data`**:
  ```json
  {
    "paymentSessionId": "sess_8819231",
    "gatewayOrderUrl": "https://api.razorpay.com/v1/checkout/sess_8819231"
  }
  ```

---

### 3.4 Service Center & Maintenance Tickets (`property` Domain)

#### `POST /api/v1/property/tenant/maintenance-tickets`
- **Description**: Creates a new tenant maintenance request.
- **Request Body**:
  ```json
  {
    "title": "Water seepage in bathroom",
    "description": "Noticeable leak under sink since yesterday evening.",
    "category": "PLUMBING",
    "priority": "HIGH",
    "photoUrls": ["https://storage.tenantapp.com/tickets/img1.jpg"]
  }
  ```
- **Response `data`**:
  ```json
  {
    "ticketId": "t-9901-uuid",
    "ticketNumber": "#SR-9901",
    "title": "Water seepage in bathroom",
    "category": "PLUMBING",
    "priority": "HIGH",
    "status": "TECHNICIAN_ASSIGNED",
    "createdAt": "2026-07-20T14:00:00Z"
  }
  ```

#### `GET /api/v1/property/tenant/maintenance-tickets`
- **Description**: Returns paginated maintenance tickets.
- **Query Params**: `page=0&size=10`
- **Response `data`**:
  ```json
  {
    "content": [
      {
        "ticketId": "t-9901-uuid",
        "ticketNumber": "#SR-9901",
        "title": "Water seepage in bathroom",
        "category": "PLUMBING",
        "priority": "HIGH",
        "status": "TECHNICIAN_ASSIGNED",
        "createdAt": "2026-07-20T14:00:00Z"
      }
    ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 2,
    "totalPages": 1,
    "last": true
  }
  ```

#### `GET /api/v1/property/tenant/maintenance-tickets/health-stats`
- **Description**: Metrics for Service Health card.
- **Response `data`**:
  ```json
  {
    "activeTicketsCount": 2,
    "resolvedMtdCount": 14
  }
  ```

---

### 3.5 Notice Board & Critical Alerts (`announcement` Domain)

#### `GET /api/v1/announcement/tenant/notices`
- **Description**: Returns landlord notices for tenant's building.
- **Query Params**: `page=0&size=10`
- **Response `data`**:
  ```json
  {
    "content": [
      {
        "id": "ann-101-uuid",
        "title": "Scheduled Elevator Maintenance",
        "content": "Elevator A will be offline between 2 PM and 5 PM on Tuesday.",
        "category": "MAINTENANCE",
        "severity": "CRITICAL",
        "read": false,
        "createdAt": "2026-07-20T10:00:00Z"
      }
    ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  }
  ```

#### `POST /api/v1/announcement/tenant/notices/{noticeId}/acknowledge`
- **Description**: Marks critical notice as read.
- **Response `data`**:
  ```json
  {
    "noticeId": "ann-101-uuid",
    "acknowledgedAt": "2026-07-20T15:00:00Z"
  }
  ```

---

### 3.6 Move-In Inventory Inspection (`property` Domain)

### 3.6 Move-In Inventory Inspection (`property` Domain) [DEFERRED - KEPT MOCKED]

> [!NOTE]
> **Admin-First Strategy**: Inventory CRUD and inspection records will be implemented first on the Admin/Landlord portal in a subsequent phase. The tenant inventory screen (`TenantInventoryScreen.tsx`) remains 100% mocked via `mockInventoryData.ts` for this phase.

---

## 4. Database Schema & Flyway Migration Specs

Flyway Script Path: `backend/src/main/resources/db/migration/V7__tenant_hub_tables.sql`

```sql
-- 1. Maintenance Ticket Table
CREATE TABLE maintenance_ticket_tbl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(32) NOT NULL UNIQUE,
    tenant_id UUID NOT NULL REFERENCES user_tbl(id),
    lease_id UUID NOT NULL REFERENCES lease_tbl(id),
    property_id UUID NOT NULL REFERENCES property_tbl(id),
    unit_id UUID NOT NULL REFERENCES unit_tbl(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    assigned_technician_name VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maint_ticket_tenant ON maintenance_ticket_tbl(tenant_id);
CREATE INDEX idx_maint_ticket_property ON maintenance_ticket_tbl(property_id);

-- 2. Notice Acknowledgment Table
CREATE TABLE notice_acknowledgment_tbl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES announcement_tbl(id),
    tenant_id UUID NOT NULL REFERENCES user_tbl(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_notice_tenant UNIQUE (notice_id, tenant_id)
);

CREATE INDEX idx_notice_ack_tenant ON notice_acknowledgment_tbl(tenant_id);
```

---

## 5. Execution Plan & Next Steps

1. **Database Layer**: Execute Flyway migration script `V7__tenant_hub_tables.sql`.
2. **Backend Domain Layer**: Implement entity models, DTOs, `CrudService` interfaces, and Spring `@RestController` classes for `/api/v1/{domain}/tenant/...`.
3. **Frontend API Layer**: Wire `TenantAppFE/src/features/tenant/api` and `TenantAppFE/src/features/inventory/api` to use real backend API calls.
4. **Validation**: Execute `npm run quality` in frontend and `mvn clean test` in backend to ensure 100% test pass.
