# Multi-Structure Foundation — Complete Implementation Plan

> **Status**: Approved Design. Ready for phased implementation.
> **Base Design Doc**: [`multi-structure-foundation.md`](./multi-structure-foundation.md)
> **Branch naming**: `feature/multi-structure-foundation`

---

## 0. Executive Summary

The current codebase supports exactly one property shape: a rental property where one
owner holds full authority over every unit beneath a single `PropertyTbl` row. This plan
extends the data model, authorization engine, and both frontend apps to support a second
shape — the **Builder-Floor Building** — where multiple independent floor-owners each
hold unit-scoped authority, and a shared maintenance fund lives at the property scope.

The design principle is unchanged from the base doc: **extend via enum values and scope
generalization, never via new grouping tables above `PropertyTbl`.**

Every phase below is sequenced so that the currently-deployed rental flow continues to
work without any behavioral change throughout.

---

## Phase 1 — Backend Database Schema & Flyway Migration (V9)

**Goal**: Generalize `MembershipTbl`, join codes, modules, and add shared-fund tables.
No application logic changes yet — just the schema that will back all of Phase 2+.

### 1.1 `membership_tbl` & `membership_role_tbl` — Scope Generalization

Replace the hardcoded `property_id` column with a polymorphic scope pair:

```sql
-- V9 up
ALTER TABLE membership_tbl
  ADD COLUMN scope_type ENUM('PROPERTY', 'UNIT') NOT NULL DEFAULT 'PROPERTY' AFTER id,
  ADD COLUMN scope_id   VARCHAR(36)               NOT NULL DEFAULT '' AFTER scope_type;

UPDATE membership_tbl
  SET scope_type = 'PROPERTY', scope_id = property_id;

ALTER TABLE membership_tbl DROP FOREIGN KEY fk_membership_property;
ALTER TABLE membership_tbl DROP COLUMN property_id;

-- Same pattern for membership_role_tbl
ALTER TABLE membership_role_tbl
  ADD COLUMN scope_type ENUM('PROPERTY', 'UNIT') NOT NULL DEFAULT 'PROPERTY' AFTER id,
  ADD COLUMN scope_id   VARCHAR(36)               NOT NULL DEFAULT '' AFTER scope_type;

UPDATE membership_role_tbl
  SET scope_type = 'PROPERTY', scope_id = property_id;

ALTER TABLE membership_role_tbl DROP FOREIGN KEY fk_membership_role_property;
ALTER TABLE membership_role_tbl DROP COLUMN property_id;
```

> **Guard**: Verify `SELECT COUNT(*) FROM membership_tbl WHERE scope_id = ''` = 0 before
> dropping the old column. Migration must abort on mismatch.

### 1.2 `property_join_code_tbl` → `membership_join_code_tbl`

```sql
RENAME TABLE property_join_code_tbl TO membership_join_code_tbl;

ALTER TABLE membership_join_code_tbl
  ADD COLUMN scope_type ENUM('PROPERTY', 'UNIT') NOT NULL DEFAULT 'PROPERTY',
  ADD COLUMN scope_id   VARCHAR(36)               NOT NULL DEFAULT '';

UPDATE membership_join_code_tbl
  SET scope_type = 'PROPERTY', scope_id = property_id;

ALTER TABLE membership_join_code_tbl DROP FOREIGN KEY fk_join_code_property;
ALTER TABLE membership_join_code_tbl DROP COLUMN property_id;
```

### 1.3 `property_tbl` — Structure Type Column

```sql
ALTER TABLE property_tbl
  ADD COLUMN structure_type ENUM('RENTAL', 'BUILDER_FLOOR') NOT NULL DEFAULT 'RENTAL'
  AFTER type;
```

All existing rows remain `RENTAL`. No data loss. Future enum values (e.g., `SOCIETY`)
are added here — never new columns.

### 1.4 `membership_role_tbl` — Full Access Mode

Remove hardcoded `PROPERTY_OWNER` seeded row as a special case; add `is_full_access`:

```sql
ALTER TABLE membership_role_tbl
  ADD COLUMN is_full_access BOOLEAN NOT NULL DEFAULT FALSE AFTER display_name;
```

The seeded `PROPERTY_OWNER` role in V2 seed data must be updated:
`UPDATE membership_role_tbl SET is_full_access = TRUE WHERE code = 'PROPERTY_OWNER';`

### 1.5 `entity_module_tbl` (renamed from `property_module_tbl`)

```sql
RENAME TABLE property_module_tbl TO entity_module_tbl;

ALTER TABLE entity_module_tbl
  ADD COLUMN scope_type  ENUM('PROPERTY', 'UNIT')                          NOT NULL DEFAULT 'PROPERTY',
  ADD COLUMN scope_id    VARCHAR(36)                                        NOT NULL DEFAULT '',
  ADD COLUMN module_key  ENUM('RENT_COLLECTION', 'INVENTORY', 'ANNOUNCEMENTS',
                              'ISSUES', 'SHARED_FUND', 'ANALYTICS', 'REPORTS') NOT NULL,
  ADD COLUMN route       VARCHAR(255)                                       NULL,
  ADD COLUMN icon        VARCHAR(100)                                       NULL;

UPDATE entity_module_tbl
  SET scope_type = 'PROPERTY', scope_id = property_id;

ALTER TABLE entity_module_tbl DROP COLUMN property_id;
```

### 1.6 Shared Fund Tables (New)

```sql
CREATE TABLE shared_fund_expense_tbl (
  id                     VARCHAR(36)  PRIMARY KEY,
  property_id            VARCHAR(36)  NOT NULL,
  proposed_by_user_id    VARCHAR(36)  NOT NULL,
  title                  VARCHAR(255) NOT NULL,
  description            TEXT         NULL,
  proposed_amount        DECIMAL(12,2) NOT NULL,
  final_amount           DECIMAL(12,2) NULL,
  status                 ENUM('PROPOSED','APPROVED','REJECTED','PAID') NOT NULL DEFAULT 'PROPOSED',
  evidence_media_asset_id VARCHAR(36) NULL,
  receipt_media_asset_id  VARCHAR(36) NULL,
  created_at             DATETIME(6)  NOT NULL,
  decided_at             DATETIME(6)  NULL,
  paid_at                DATETIME(6)  NULL
);

CREATE TABLE shared_fund_expense_vote_tbl (
  id                   VARCHAR(36) PRIMARY KEY,
  expense_id           VARCHAR(36) NOT NULL,
  floor_owner_user_id  VARCHAR(36) NOT NULL,
  vote                 ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  voted_at             DATETIME(6) NULL,
  UNIQUE KEY uq_vote (expense_id, floor_owner_user_id)
);

CREATE TABLE property_shared_fund_ledger_tbl (
  id                        VARCHAR(36) PRIMARY KEY,
  property_id               VARCHAR(36) NOT NULL,
  transaction_type          ENUM('CONTRIBUTION','EXPENSE') NOT NULL,
  amount                    DECIMAL(12,2) NOT NULL,
  contributing_unit_id      VARCHAR(36) NULL,
  payment_transaction_id    VARCHAR(36) NULL,
  shared_fund_expense_id    VARCHAR(36) NULL,
  description               VARCHAR(500) NULL,
  created_at                DATETIME(6) NOT NULL
);
```

### 1.7 `user_preference_tbl` — Active Scope Columns

```sql
ALTER TABLE user_preference_tbl
  ADD COLUMN active_scope_type  ENUM('PROPERTY', 'UNIT') NULL,
  ADD COLUMN active_scope_id    VARCHAR(36)               NULL;
```

`activeMode` and `onboardingDone` columns are **untouched** — `OnboardingGate.tsx` in
both frontend apps depends on them directly.

---

## Phase 2 — Backend: JPA Entities & Repository Layer

Map all V9 schema changes to Java entities. No logic yet.

### Files to Modify/Create

| File | Change |
|---|---|
| `MembershipTbl.java` | Replace `propertyId` field with `scopeType: ScopeType` (enum) + `scopeId: String` |
| `MembershipRoleTbl.java` | Same scope generalization + add `isFullAccess: boolean` |
| `MembershipJoinCodeTbl.java` | Rename class, same scope generalization |
| `PropertyTbl.java` | Add `structureType: StructureType` enum field |
| `EntityModuleTbl.java` | Rename from `PropertyModuleTbl`, scope fields, new enum columns |
| `UserPreferenceTbl.java` | Add `activeScopeType` + `activeScopeId` fields |
| `SharedFundExpenseTbl.java` | **[NEW]** |
| `SharedFundExpenseVoteTbl.java` | **[NEW]** |
| `PropertySharedFundLedgerTbl.java` | **[NEW]** |
| `ScopeType.java` | **[NEW]** Enum: `PROPERTY`, `UNIT` |
| `StructureType.java` | **[NEW]** Enum: `RENTAL`, `BUILDER_FLOOR` |
| `ModuleKey.java` | **[NEW]** Enum: `RENT_COLLECTION`, `INVENTORY`, `ANNOUNCEMENTS`, `ISSUES`, `SHARED_FUND`, `ANALYTICS`, `REPORTS` |

### DTOs

| File | Change |
|---|---|
| `MembershipResponse.java` | Replace `propertyId` with `scopeType + scopeId` |
| `CreateMembershipRoleRequest.java` | Add `scopeType`, `scopeId`, `mode: FULL_ACCESS | CUSTOM`, remove `propertyId` |
| `JoinCodeRequest.java` | Add `scopeType`, `scopeId` |
| `ModuleResponse.java` | **[NEW]** — `scopeType, scopeId, moduleKey, route, icon, isActive` |

---

## Phase 3 — Backend: Authorization Engine Refactor

This is the most critical phase. All existing rental authorization behavior must be
**preserved identically** — this is a generalization, not a replacement.

### 3.1 `AuthorizationServiceImpl` Refactor

```java
// BEFORE
private void checkPermission(String propertyId, String code) { ... }

// AFTER
private void checkScopedPermission(ScopeType scopeType, String scopeId, String code) {
  // 1. Look up membership rows WHERE scope_type=scopeType AND scope_id=scopeId
  // 2. Check role's permissions (short-circuit if isFullAccess=true)
}

// Backward-compat wrapper — NEVER REMOVE
public void checkPermission(String propertyId, String code) {
  checkScopedPermission(ScopeType.PROPERTY, propertyId, code);
}
```

### 3.2 `hasPermissionByUnitId` — The OR Rule

```java
public boolean hasPermissionByUnitId(String unitId, String code) {
  // OR rule: UNIT scope first, fallback to PROPERTY scope
  if (checkScopedPermission(UNIT, unitId, code)) return true;
  String propertyId = unitRepository.findPropertyIdByUnitId(unitId);
  return checkScopedPermission(PROPERTY, propertyId, code);
}
```

### 3.3 `PropertyRoleController` Update

- `/custom` endpoint: accept `mode: FULL_ACCESS | CUSTOM`, `scopeType`, `scopeId`
- Remove the special-case `PROPERTY_OWNER` code path — it now goes through `isFullAccess`

---

## Phase 4 — Backend: Module System Activation

### 4.1 `EntityModuleService`

```java
// GET /api/v1/modules?scopeType=PROPERTY&scopeId=<uuid>
public List<ModuleResponse> getActiveModules(ScopeType scopeType, String scopeId);
```

### 4.2 Auto-Seed on Property Creation

In `PropertyService.createProperty()`:

```java
if (structureType == StructureType.RENTAL) {
  // Seed: RENT_COLLECTION, INVENTORY, ANNOUNCEMENTS, ISSUES, ANALYTICS, REPORTS
  // at PROPERTY scope
}
if (structureType == StructureType.BUILDER_FLOOR) {
  // Seed same base set at PROPERTY scope
  // ALSO seed SHARED_FUND at PROPERTY scope
}
```

When a floor-owner joins via a UNIT-scoped join code, seed:
`RENT_COLLECTION`, `INVENTORY`, `ANNOUNCEMENTS`, `ISSUES` at that UNIT scope.

---

## Phase 5 — Backend: Join Code & Membership Generalization

### 5.1 `PropertyJoinCodeController` → `MembershipJoinCodeController`

All existing endpoints renamed. The `/api/v1/property-join-codes/**` prefix is kept as a
**deprecated alias** returning 200 with a `Deprecation` response header (not 404) to
avoid breaking any mobile clients mid-release.

### 5.2 Join Code Redemption

```java
// When a UNIT-scoped join code is redeemed:
// 1. Create membership row: scope_type=UNIT, scope_id=<unit_id>
// 2. Create/assign the role at scope_type=UNIT
// 3. Seed unit-level modules (§ Phase 4.2)
// 4. Set user_preference_tbl.active_scope_type=UNIT, active_scope_id=<unit_id>
//    if this is the user's first membership
```

---

## Phase 6 — Backend: Shared Fund APIs

New controller: `SharedFundController` under `property` module.

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/properties/{id}/shared-fund/balance` | Current balance (computed via SUM) |
| `GET /api/v1/properties/{id}/shared-fund/ledger` | Paginated ledger entries |
| `POST /api/v1/properties/{id}/shared-fund/expenses` | Propose a new shared expense |
| `GET /api/v1/properties/{id}/shared-fund/expenses` | List expenses (filterable by status) |
| `POST /api/v1/properties/{id}/shared-fund/expenses/{expenseId}/vote` | Cast vote (APPROVED / REJECTED) |
| `POST /api/v1/properties/{id}/shared-fund/contributions` | Record a manual contribution |

**Vote tallying logic**:
- Pre-create one `PENDING` vote row per eligible floor-owner when expense is proposed.
- Evaluate approval threshold after each vote is cast — never defer until "check" endpoint.
- Guard: disable propose/vote if `<2` independent unit-owners under property.

---

## Phase 7 — Signup Flow Update (Backend + Both Frontends)

### 7.1 Backend: Signup Step Addition

After the existing `POST /api/v1/auth/signup` completes, the client calls a new:

```
POST /api/v1/auth/signup/structure-type
Body: { structureType: "RENTAL" | "BUILDER_FLOOR" }
```

This stores the choice in the session and uses it when the first property is created
(§ Phase 4.2 seeding). It does **not** lock the account — users can create properties
of either type later from the Command Center.

### 7.2 Landlord FE: Structure Type Selection Screen

New route: `/mode-selection` (already exists in the route map — see `PRODUCT_BIBLE.md`).
This screen is shown once, immediately after signup, before onboarding.

**Screen contents**:
- Two large cards: "Rental Property" / "Builder-Floor Building"
- Brief description under each card
- "Continue" button — stores choice locally + calls the new API above

---

## Phase 8 — Frontend: Module-Driven Navigation

Replace all hardcoded `if (activeMode === 'RENTAL')` navigation conditionals with
module-driven rendering.

### 8.1 `useModules()` Hook

```typescript
// src/hooks/useModules.ts
export function useModules(scopeType: ScopeType, scopeId: string) {
  // Calls GET /api/v1/modules?scopeType=X&scopeId=Y
  // Returns: ModuleResponse[]
  // Cached in React Query / SWR with 5-min stale time
}
```

### 8.2 Navigation Rendering

`SidebarNavigation.tsx` and `BottomNavigation.tsx` both iterate `modules` from
`useModules()` to build navigation entries. The `route` field in each `ModuleResponse`
carries the actual Expo Router path. No name-to-route mapping table needed in the client.

---

## Phase 9 — Frontend: Builder-Floor UI Additions

### 9.1 Property Detail — Structure Badge

`CommandCenterScreen.tsx`: Show a pill badge on each property card indicating
`RENTAL` or `BUILDER FLOOR`. Color-coded using theme tokens.

### 9.2 Shared Fund Screen

New route: `/properties/[id]/shared-fund`

**Sections**:
1. **Fund Balance** — `StatCard` showing current balance
2. **Propose Expense** — bottom sheet (similar to announcement composer)
3. **Expense List** — filterable by status (PROPOSED / APPROVED / REJECTED / PAID)
4. **My Vote** — per-expense voting pill (APPROVE / REJECT / PENDING)
5. **Ledger** — paginated contributions + expense payments

### 9.3 Unit Owner Management

Under the existing Floor Editor (`/properties/[id]/floors/[floor]`), add:
- "Assign Owner" action for each unit (generates a UNIT-scoped join code)
- Owner badge on occupied units showing the floor-owner's name (not a tenant)
- Distinction in the 3D Building View: floor-owner vs. rented-to-tenant occupancy

---

## Phase 10 — Active Scope Context Switcher

A user holding memberships across multiple properties/units needs a context picker.

### 10.1 Backend

`GET /api/v1/user/scope-memberships` — returns all `{scopeType, scopeId, displayName, structureType}` the user has access to. Used to populate the switcher.

`PUT /api/v1/user/preferences` — existing endpoint, updated to accept
`activeScopeType` + `activeScopeId` for persistence.

### 10.2 Frontend

A compact scope switcher pill appears in:
- `DesktopNavBar.tsx`: replaces the existing property-only dropdown when the user holds unit-level memberships
- `MobileHeader.tsx`: existing property switcher pill now shows scope type alongside name

On scope switch, `useModules()` re-fetches with the new scope, and navigation re-renders
automatically — no full-page reload needed.

---

## Verification Plan

### Per-Phase Verification

| Phase | Verification |
|---|---|
| 1 | `SELECT COUNT(*) FROM membership_tbl WHERE scope_id = ''` = 0 post-migration |
| 2 | All JPA entity unit tests pass; Hibernate `validate` mode boots with 0 errors |
| 3 | All existing `AuthorizationServiceImpl` integration tests pass unchanged |
| 4 | `GET /api/v1/modules` returns correct rows for both RENTAL and BUILDER_FLOOR test properties |
| 5 | Existing join code flow tested end-to-end; deprecated alias returns 200 |
| 6 | Propose → vote → approval → ledger entry recorded in one test fixture |
| 7 | Signup flow for both structure types reaches first property creation |
| 8 | Navigation items match module rows exactly (no extra, no missing items) |
| 9 | Shared fund screen loads and propose/vote flow completes on device |
| 10 | Scope switch re-fetches modules and navigation re-renders within 200ms |

### Architectural Guard

Run `./mvnw verify -P archunit` after Phase 3 to confirm no `ModuleBoundaryTest`
violations. The new `scope_id` UUID columns follow the same polymorphic pattern already
used by `payment_transaction_tbl.reference_id` and `finance_ledger_tbl.reference_id`.

---

## Open Questions (Confirm Before Phase 6)

> [!IMPORTANT]
> **Voting Threshold**: Is the shared fund expense approval threshold `MAJORITY` or
> `UNANIMOUS`? Should this be a per-property setting stored as a typed column on
> `PropertyTbl` (following the `allowPartialPayment` precedent)?

> [!IMPORTANT]
> **Shell Manager Vote**: Does the property-level manager (PROPERTY-scoped Full Access
> membership) also get a vote on shared fund expenses, in addition to UNIT-scoped
> floor-owners?

> [!IMPORTANT]
> **Deprecated Alias Sunset**: What is the sunset timeline for the old
> `/api/v1/property-join-codes/**` aliases? Needs coordination with any mobile release
> that could still be calling the old path.

---

## Deferred (Explicitly Out of Scope)

- **Broker accounts** — separate axis from structure type; deferred to post-production of both shapes
- **Society** — same mechanism as builder-floor; added later via enum values only
- **Onboarding checklist / activation funnel** — drafted separately
- **QR booking / cold discovery signup routing** — join-code flow already handles its own structure

---

## Branch & Commit Strategy

```
feature/multi-structure-foundation
  └── feat(db): V9 flyway migration — scope generalization & shared fund tables
  └── feat(entity): JPA entities for V9 schema
  └── feat(auth): scope-generalized authorization engine
  └── feat(modules): entity module system activation
  └── feat(join-code): membership join code generalization
  └── feat(shared-fund): shared fund APIs
  └── feat(signup): structure type selection step
  └── feat(fe-modules): module-driven navigation in landlord FE
  └── feat(fe-shared-fund): shared fund screen & expense voting UI
  └── feat(fe-scope-switch): active scope context switcher
```

*This document is the canonical implementation reference for
the multi-structure foundation feature.*
