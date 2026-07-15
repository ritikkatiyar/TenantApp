# Inventory Backend Phase 2 Implementation Plan

## Summary

Phase 2 will replace the Phase 1 mock inventory frontend with production Spring Boot APIs for inventory assets, lease move-in assignment, move-out verification, deposit settlement, and owner-only service expense history.

The backend must follow the project standards in `ENGINEERING_STANDARDS.md`: modular monolith, package-by-feature, DDD-lite layers, DTO-only APIs, Flyway migrations, UUID primary keys, thin controllers, and service-interface communication across modules.

## Engineering Standards Alignment

- Architecture remains a modular monolith with bounded-context modules, layered architecture, and DDD-lite service boundaries.
- API paths must be domain-prefixed: finance-owned lease APIs under `/api/v1/finance/...`; inventory-owned APIs under `/api/v1/inventory/...`.
- Controllers must stay thin and delegate business rules to service interfaces and implementations.
- APIs must return the standard `ApiResponse` shape and must never expose entity classes directly.
- All request and response payloads must use DTOs with validation annotations on request DTOs.
- Schema changes, permission seed rows, and table creation must be delivered only through Flyway migrations.
- Primary keys must be UUID values, table names must use lowercase `_tbl`, and columns must use `snake_case`.
- Modules must communicate only through service interfaces; no direct repository access across module boundaries.
- Authenticated user and permissions must come from JWT/security context and database-backed permission checks, never from request-body user IDs or hardcoded role branching.
- Implementation must include structured logging with correlation/trace context for state-changing operations, without logging request bodies, tokens, or sensitive tenant data.
- Phase completion requires compile success, application startup success, and working API tests for the endpoints listed in this plan.

## Module Boundary

Create a new top-level backend module:

```text
com.tenantliving.inventory
|-- controller
|-- service
|   |-- interface
|   `-- impl
|-- domain
|-- repository
|-- dto
`-- mapper
```

Allowed dependencies:

- `inventory` may call `property` service interfaces to resolve property/unit ownership.
- `inventory` may call `finance` service interfaces to resolve leases and create ledger settlement entries.
- `inventory` must not access repositories from `property`, `finance`, `auth`, or `user` directly.
- Other modules should consume inventory through service interfaces only.

Module registration:

- `inventory` is not currently in the "Approved Top-Level Modules" list in `ENGINEERING_STANDARDS.md`; add it there as part of this phase's scope, following the same one-line format as the existing entries.

## Prerequisites

- Lease registry endpoint must be added before inventory assignment work starts:
  - `GET /api/v1/finance/leases/property/{propertyId}`
  - This matches the existing convention used by `ChargeConfigController`: `GET /api/v1/finance/charge-configs/property/{propertyId}`.
  - Add this to `LeaseController` and `LeaseQueryService` in the finance module.
- `LedgerService` currently only exposes `getLedgerForProperty()` as a read-only interface.
  - `FinanceLedgerTbl` rows are today only written directly via repository inside `RentCycleServiceImpl`; no module-crossing write path exists.
  - Before inventory's settlement feature (`POST /api/v1/inventory/leases/{leaseId}/settlement`) can be implemented, the finance module needs a new interface method, for example `LedgerService.recordSettlementEntry(...)`, added to `finance/service/interfaces/LedgerService.java` and implemented in `LedgerServiceImpl`.
  - Inventory must use that finance service interface to create `ADJUSTMENT` and `REFUND` entries instead of reaching into finance repositories directly.

## Database Changes

Create one Flyway migration after the current latest migration.

Tables:

- `inventory_item_tbl`
  - Physical asset record scoped to a property, optionally to a unit.
  - Fields: `id`, `property_id`, `unit_id`, `name`, `category`, `serial_number`, `model_number`, `scope`, `current_condition`, `status`, `purchase_date`, `warranty_expires_at`, `next_service_date`, `replacement_value`, `notes`, audit timestamps.

- `lease_inventory_assignment_tbl`
  - Snapshot per lease-item assignment.
  - Fields: `id`, `lease_id`, `item_id`, `condition_at_assignment`, `assigned_at`, `assignment_notes`, `condition_at_return`, `returned_at`, `return_notes`, `damage_deduction_amount`, `deduction_approval_status`, `verified_by`, `settled_at`, audit timestamps.
  - Enforce one active assignment per physical item.

- `inventory_service_expense_tbl`
  - Owner bookkeeping only for Phase 2.
  - Fields: `id`, `item_id`, `property_id`, `vendor_name`, `service_date`, `amount`, `description`, `next_service_date`, `recorded_by`, audit timestamps.

- `inventory_evidence_tbl`
  - Metadata for inventory photos/documents; binary files are stored in object storage, not in the database.
  - Fields: `id`, `property_id`, `lease_id`, `item_id`, `assignment_id`, `evidence_type`, `capture_stage`, `storage_provider`, `bucket_name`, `object_key`, `original_filename`, `content_type`, `byte_size`, `checksum_sha256`, `image_width`, `image_height`, `status`, `uploaded_by`, `uploaded_at`, audit timestamps.
  - `lease_id`, `item_id`, and `assignment_id` are nullable only where the evidence is not yet bound to that entity, for example item primary images before assignment.
  - Store object keys and metadata only. Do not store public URLs because access must remain permission-scoped and time-limited.

Enums:

- `InventoryCondition`: `EXCELLENT`, `GOOD`, `FAIR`, `DAMAGED`, `NEEDS_REPAIR`
- `InventoryItemStatus`: `AVAILABLE`, `ASSIGNED`, `SHARED`, `SERVICE_DUE`, `RETIRED`
- `InventoryScope`: `PROPERTY_SHARED`, `UNIT_PRIVATE`
- `DeductionApprovalStatus`: `NONE`, `PENDING_OWNER_APPROVAL`, `APPROVED`, `REJECTED`, `SETTLED`
- `InventoryEvidenceType`: `ITEM_PRIMARY_IMAGE`, `MOVE_IN_PHOTO`, `MOVE_OUT_PHOTO`, `SERVICE_PHOTO`, `DAMAGE_PHOTO`, `DOCUMENT`
- `InventoryEvidenceStage`: `ITEM_REGISTRY`, `MOVE_IN`, `MOVE_OUT`, `SERVICE`
- `InventoryEvidenceStatus`: `PENDING_UPLOAD`, `ACTIVE`, `DELETED`
- `StorageProvider`: `CLOUDINARY`, `R2`, `LOCAL`

## API Surface

All endpoints must use `/api/v1/inventory/...` and return the standard `ApiResponse`.

Owner/caretaker APIs:

- `GET /api/v1/finance/leases/property/{propertyId}`
  - Required lease registry endpoint for the owner/caretaker frontend before inventory assignment can be fully backend-driven.
  - This matches the existing convention used by `ChargeConfigController`: `GET /api/v1/finance/charge-configs/property/{propertyId}`.
  - Add this to `LeaseController` and `LeaseQueryService` in the finance module as a prerequisite task, completed before inventory assignment work starts.
  - Query params: `status`, `q`, `page`, `size`, `sort`.
  - Response DTO must include lease id, tenant display name, tenant phone, property name, unit number, floor label, move-in date, move-out date, monthly rent, security deposit, lease status, assigned inventory count, and pending checklist count.
- `GET /api/v1/inventory/properties/{propertyId}/items`
  - Query params: `q`, `status`, `scope`, `serviceDueOnly`, `page`, `size`, `sort`.
  - Response DTO must support the owner registry cards and table: item id, name, category, property id/name, unit id/number when private, display location, serial number, model number, current condition, status, next service date, replacement value, shared flag/scope, notes, and primary image/document URL when available.
- `POST /api/v1/inventory/items`
- `PUT /api/v1/inventory/items/{itemId}`
- `POST /api/v1/inventory/leases/{leaseId}/assignments`
  - Request DTO accepts selected item IDs with condition-at-assignment, assignment notes, and evidence attachment references.
- `GET /api/v1/inventory/leases/{leaseId}/assignments`
  - Response DTO must support the move-in assignment checklist: item fields, assignment status, condition at assignment, assignment notes, photo count, and condition history link/reference.
- `POST /api/v1/inventory/leases/{leaseId}/move-out-checklist`
- `PUT /api/v1/inventory/assignments/{assignmentId}/return-verification`
  - Request DTO accepts return condition, return notes, damage description, deduction estimate, and evidence attachment references.
- `POST /api/v1/inventory/leases/{leaseId}/deductions/approve`
- `POST /api/v1/inventory/leases/{leaseId}/settlement`
- `POST /api/v1/inventory/items/{itemId}/service-expenses`
  - Request DTO records vendor name, service date, amount, description, and next service date.
- `POST /api/v1/inventory/evidence/upload-intents`
  - Creates an evidence metadata row in `PENDING_UPLOAD` status and returns a short-lived presigned upload URL.
  - Request DTO: `propertyId`, optional `leaseId`, optional `itemId`, optional `assignmentId`, `evidenceType`, `captureStage`, `originalFilename`, `contentType`, `byteSize`, optional `checksumSha256`.
  - Response DTO: `evidenceId`, `uploadUrl`, `method`, required upload headers, `expiresAt`, and `objectKey`.
- `POST /api/v1/inventory/evidence/{evidenceId}/complete`
  - Marks evidence as `ACTIVE` after upload succeeds and validates size/content type/checksum when available.
- `GET /api/v1/inventory/evidence/{evidenceId}/view-url`
  - Returns a short-lived signed read URL only after permission and tenant-scope checks pass.
- `DELETE /api/v1/inventory/evidence/{evidenceId}`
  - Soft-deletes the evidence metadata and schedules object deletion according to retention rules.

Tenant APIs:

- `GET /api/v1/inventory/my-visible-items?propertyId={propertyId}`
  - Return only property-shared items and items assigned to the authenticated tenant's active lease/unit.
  - Response DTO must support the tenant read-only inventory screen: item id, name, category, display location, condition, shared/private scope, notes, move-in evidence/photo references, last verified metadata, and visible property-wide inventory items.

Existing finance APIs used by the lease frontend:

- `POST /api/v1/finance/leases`
  - Existing lease creation endpoint used by the owner "Create Lease" action. This remains finance-owned and should not be duplicated in inventory.
- `GET /api/v1/finance/leases/{id}`
  - Existing detail endpoint for deep-linking into a single lease.
- `DELETE /api/v1/finance/leases/{id}`
  - Existing lease deletion/removal endpoint, if still supported by current finance permissions.

Out-of-scope frontend placeholders:

- Tenant "Raise Issue" should integrate with the issues/escalations module, not this inventory Phase 2 plan.
- Tenant "Book Amenity" should integrate with a future amenity/booking capability; this plan only exposes property-wide inventory visibility.
- Owner/tenant photo upload storage is referenced through evidence attachment IDs/URLs. The file storage implementation must follow the existing project media/document pattern when that backend slice is planned.

## Photo and Evidence Storage Plan

Use object storage for all photos and documents. The database stores metadata, ownership, permission scope, and object keys only.

Recommended provider for Phase 2:

- Use Cloudinary for development and demos because it has a no-credit-card free plan and is quick to validate image upload/display flows.
- Use local filesystem storage as a fallback development mode when no external storage account is configured.
- Use Cloudflare R2 as the production object storage provider once the account and billing setup are available.
- R2 is appropriate for production because the inventory feature is photo-heavy, object access is mostly upload/download, and R2 is S3-compatible enough to keep the backend portable behind an internal storage interface.
- Keep the implementation provider-neutral through a `StorageService` abstraction in `common`/`config` infrastructure, for example `createPresignedPutUrl`, `createPresignedGetUrl`, and `deleteObject`.
- Do not let `inventory` call Cloudinary or R2 SDKs directly from business services. Inventory should call the project storage interface, then persist inventory-specific evidence metadata in `inventory_evidence_tbl`.
- The implementation should support `CloudinaryStorageServiceImpl` for development, `R2StorageServiceImpl` for production, and `LocalStorageServiceImpl` for tests/fallback without changing inventory services or controllers.

Upload flow:

1. Frontend asks backend for an upload intent with file metadata and target context.
2. Backend authorizes the user against property/lease/inventory permissions.
3. Backend creates `inventory_evidence_tbl` row with `PENDING_UPLOAD`.
4. Backend generates a provider-specific signed upload target:
   - Cloudinary development: signed upload parameters/signature generated by backend.
   - R2 production: short-lived presigned `PUT` URL for an object key under the tenant app bucket.
5. Frontend uploads the file directly to object storage using that URL.
6. Frontend calls complete endpoint.
7. Backend validates metadata and marks the evidence row `ACTIVE`.
8. Frontend references `evidenceId` when assigning inventory, verifying return condition, recording damage, or showing tenant read-only photos.

Cloudinary development upload flow:

1. Frontend asks backend for an upload intent.
2. Backend creates `inventory_evidence_tbl` row with `storage_provider = CLOUDINARY` and `PENDING_UPLOAD`.
3. Backend returns signed Cloudinary upload parameters and target folder/public ID.
4. Frontend uploads directly to Cloudinary.
5. Frontend calls the complete endpoint with Cloudinary response metadata.
6. Backend stores Cloudinary `public_id`, `asset_id`, `secure_url` if needed for development, byte size, content type, and dimensions.
7. Backend exposes images through evidence APIs so the frontend remains provider-neutral.

Local development upload flow:

1. Frontend sends the image to the backend using the same upload intent/evidence concept.
2. Backend stores the file under a configured local directory such as `./data/uploads/inventory`.
3. Backend stores `storage_provider = LOCAL`, relative object path, metadata, and `evidenceId` in `inventory_evidence_tbl`.
4. Backend serves files only through authenticated evidence view endpoints, not as public static files.
5. This mode is for development and demos only; production should use object storage.

Download/view flow:

1. Frontend requests a view URL by `evidenceId`.
2. Backend checks the authenticated user's DB-backed permission and tenant/property/lease scope.
3. Backend returns a short-lived signed `GET` URL.
4. Frontend displays the image from the signed URL.

Object key convention:

```text
properties/{propertyId}/leases/{leaseId}/inventory/{stage}/{evidenceId}/{safeFilename}
properties/{propertyId}/items/{itemId}/registry/{evidenceId}/{safeFilename}
```

Storage and security rules:

- Buckets must be private. Do not use public buckets for inventory evidence.
- Store `object_key`, `bucket_name`, `storage_provider`, `content_type`, `byte_size`, checksum metadata, and provider-specific metadata in the database.
- For Cloudinary, `object_key` should store the Cloudinary `public_id`; provider metadata can store `asset_id`, `version`, delivery type, and transformation details.
- Never store R2 credentials in source code. Use environment variables or secret management.
- Never store Cloudinary API secrets in source code. Use environment variables or secret management.
- For local development, store uploaded files outside source-controlled folders and add the upload directory to `.gitignore`.
- Presigned upload URLs should be short-lived, for example 5-15 minutes.
- Presigned view URLs should be short-lived, for example 1-5 minutes.
- Restrict accepted content types to image/document formats required by the product, for example JPEG, PNG, WebP, HEIC if mobile support requires it, and PDF for documents.
- Enforce max upload size in both backend validation and storage upload policy.
- Use server-generated object keys only. Do not trust client-provided paths.
- Evidence deletion should be soft-delete first; physical object deletion can be async or retention-based.

## Frontend API Coverage Matrix

| Frontend screen/action | Backend API coverage | Phase 2 status |
| --- | --- | --- |
| Owner lease registry list | `GET /api/v1/finance/leases/property/{propertyId}` | Prerequisite finance task |
| Owner lease search/filter/status cards | `GET /api/v1/finance/leases/property/{propertyId}?status=&q=&page=&size=&sort=` | Prerequisite finance task |
| Owner create lease button | `POST /api/v1/finance/leases` | Existing finance API |
| Owner open move-in assignment from lease | `GET /api/v1/inventory/leases/{leaseId}/assignments` | Inventory Phase 2 |
| Owner confirm move-in assignment | `POST /api/v1/inventory/leases/{leaseId}/assignments` | Inventory Phase 2 |
| Owner inventory registry | `GET /api/v1/inventory/properties/{propertyId}/items` | Inventory Phase 2 |
| Owner inventory search/service filter | `GET /api/v1/inventory/properties/{propertyId}/items?q=&serviceDueOnly=&status=&scope=` | Inventory Phase 2 |
| Owner add inventory item | `POST /api/v1/inventory/items` | Inventory Phase 2 |
| Owner edit inventory item | `PUT /api/v1/inventory/items/{itemId}` | Inventory Phase 2 |
| Owner upload item/assignment photos | `POST /api/v1/inventory/evidence/upload-intents` and `POST /api/v1/inventory/evidence/{evidenceId}/complete` | Inventory Phase 2 |
| Owner record service expense | `POST /api/v1/inventory/items/{itemId}/service-expenses` | Inventory Phase 2 |
| Owner open move-out checklist | `POST /api/v1/inventory/leases/{leaseId}/move-out-checklist` and `GET /api/v1/inventory/leases/{leaseId}/assignments` | Inventory Phase 2 |
| Owner/caretaker verify return condition | `PUT /api/v1/inventory/assignments/{assignmentId}/return-verification` | Inventory Phase 2 |
| Owner approve deductions | `POST /api/v1/inventory/leases/{leaseId}/deductions/approve` | Inventory Phase 2 |
| Owner settle deposit | `POST /api/v1/inventory/leases/{leaseId}/settlement` | Requires finance ledger prerequisite |
| Tenant read-only inventory | `GET /api/v1/inventory/my-visible-items?propertyId={propertyId}` | Inventory Phase 2 |
| Tenant view move-in photos | `GET /api/v1/inventory/evidence/{evidenceId}/view-url` using evidence IDs from tenant inventory response | Inventory Phase 2 |
| Tenant raise issue | Existing/future issue module API | Out of scope |
| Tenant book amenity | Future amenity/booking API | Out of scope |

Security:

- Add `INVENTORY_VIEW`, `INVENTORY_MANAGE`, `INVENTORY_VERIFY`, and `INVENTORY_SETTLE` as new constants in `common/constant/PermissionConstants.java`, following the existing naming style such as `LEASE_CREATE` and `LEASE_VIEW`.
- Permissions are DB-driven in this codebase. Owner/caretaker/tenant permission assignments must be added as seed rows into `role_permission_tbl` through the same Flyway migration that creates the inventory tables, not implemented as in-code role branching.
- Owner/manager should receive all inventory permissions.
- Caretaker should receive view, manage assignment/checklist, and verify return permissions.
- Tenant should receive only own visible inventory access; never trust tenant/user IDs from request body.
- Tenant-scoped visibility for `GET /api/v1/inventory/my-visible-items?propertyId={propertyId}` should follow the existing `PROPERTY_VIEW_OWN_LEASE` scoping pattern rather than introducing a new mechanism.

## Business Rules

- A physical item can move across multiple tenancies, but each lease assignment must keep its own condition snapshot.
- The same physical item cannot be assigned to two active leases at the same time.
- Move-out checklist creation must be idempotent.
- Checklist rows are created automatically from a lease move-out event and can also be created manually for recovery.
- Deposit settlement is blocked when any assigned item lacks return verification.
- Damage deductions require owner approval before ledger entries are written.
- Settlement writes:
  - one `ADJUSTMENT` ledger entry for approved deductions,
  - one `REFUND` ledger entry for `securityDeposit - approvedDeductions`.
- Settlement must reject negative refunds.
- Service expenses are internal owner bookkeeping only in Phase 2 and must not create tenant charges.

## Events

Add a lease lifecycle event in the finance/common boundary:

- `LeaseMoveOutRequestedEvent`
  - Fields: `leaseId`, `propertyId`, `unitId`, `tenantId`, `moveOutDate`
  - Implement as a plain `ApplicationEvent` placed in `com.tenantliving.common.event`, following the same shape as the existing `PropertyDeletionEvent` in that package.

Publish it from wherever move-out is set on `LeaseTbl` in the finance module. The inventory module listens with `@EventListener` and `@Transactional` on the listener method itself, matching the pattern used by `PropertyDeletionAuthListener`. Do not use `@TransactionalEventListener(phase = AFTER_COMMIT)` for this event; that pattern is specific to `NotificationEventListener`'s async fan-out and is not the general cross-module event convention in this codebase.

The inventory listener creates pending checklist records for all active assignments on that lease.

## Frontend Integration Contract

The Phase 1 frontend currently uses mock fields equivalent to:

- lease summary: `id`, `tenantName`, `tenantPhone`, `propertyName`, `unitNumber`, `floorLabel`, `moveInDate`, `moveOutDate`, `rentAmount`, `securityDeposit`, `status`, `assignedInventoryCount`, `pendingChecklistCount`
- item: `id`, `name`, `category`, `location`, `serial`, `condition`, `status`, `nextService`, `value`, `shared`, `notes`
- assignment: item fields plus `assignmentCondition`, `assignmentStatus`, `photoCount`
- verification: `name`, `area`, `moveInCondition`, `returnCondition`, `damageDescription`, `deduction`, `status`
- tenant visible item: item fields plus move-in evidence/photo references, read-only visibility metadata, and last verified metadata

DTO responses should preserve these concepts, even if backend field names use enum values and UUID references.

## Testing

Required backend tests:

- item CRUD with permission checks.
- tenant visibility excludes other unit-private items.
- same active physical item cannot be assigned to two active leases.
- move-out event creates checklist rows idempotently.
- manual checklist creation is idempotent.
- return verification requires owner/caretaker authorization.
- owner approval changes deduction status.
- settlement writes correct `ADJUSTMENT` and `REFUND` ledger entries.
- settlement is blocked when checklist items are pending, deductions are unapproved, or refund is negative.

Run:

```bash
mvn -f backend/pom.xml test
```

## Open Decisions

- "Inventory" vs "Asset" naming is undecided. The property module's bounded-context description in `ENGINEERING_STANDARDS.md` already claims "Real Estate / Asset Management," so renaming this module to "Asset" would require first updating that description to avoid two modules both being labeled "Asset Management." Default to "Inventory" until this is explicitly decided.
- `lease_inventory_assignment_tbl` binds to `lease_id`. Extending inventory assignment to `INDIVIDUAL` property type depends on the still-open decision between synthetic self-lease reuse of the billing engine and a separate individual-mode data model. Extending to `SOCIETY` property type is further out; no `SocietyTbl` exists yet in the codebase, and society was scoped separately as needing ledger-first double-entry bookkeeping and its own hierarchy. No schema change is needed for Phase 2 itself; this is tracked debt, not a blocker.
