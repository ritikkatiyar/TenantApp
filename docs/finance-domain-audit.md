# Finance Domain Implementation Audit

Audit date: 2026-06-13

Scope: actual repository code under `backend/src/main/java/com/tenantliving/finance`, related Finance enums, Flyway migrations, direct cross-module dependencies, and tests. The separate `com.tenantliving.billing` package is treated as SaaS subscription/AI-wallet billing, not tenant rent collection.

## Executive Summary

**Finance Domain Score: 4.0/10**

**Estimated Completion: Current State = 35%**

The percentage is a capability-matrix estimate: Implemented = 1 point, Partially Implemented = 0.5, Not Implemented = 0. It is not a delivery estimate.

**Target State: Production Grade Finance Engine**

The module has a usable CRUD-level foundation for leases, manually generated rent cycles, charge line items, shared expenses, expense splits, and meter-reading worksheets. It is not yet a production finance engine because it has no rent-payment entity or ledger, no partial payments, no deposit transactions, no automatic cycle/overdue/penalty processing, no proration or rent revision, no refund flow, and no Finance analytics.

The most serious current risks are:

1. Finance authorization is role-based but not resource-scoped. Several list/get/mutate APIs can access arbitrary records when the caller has a broad role.
2. Lease "termination" physically deletes the lease and cascades deletion of rent-cycle history.
3. Java supports `RentChargeType.CUSTOM`, but the database `rent_cycle_charge_tbl.charge_type` enum does not.
4. Metered charge calculation uses a hard-coded consumption value and is not connected to saved meter readings or rent-cycle generation.
5. "Mark paid" changes a cycle status without creating a payment, ledger entry, method, reference, or audit trail.
6. No direct Finance tests exist.

## Implementation Inventory

### Entities

| Entity | Purpose | Status | Evidence |
|---|---|---|---|
| `LeaseTbl` | Tenant-to-unit occupancy and rent agreement | Partially Implemented | Rent, deposit, dates, status, split strategy exist; no lifecycle behavior or history. `finance/domain/LeaseTbl.java:20-48` |
| `RentCycleTbl` | Monthly owner billing cycle | Partially Implemented | Base/total/due/status/paidAt exist; no paid balance, cancellation, versioning, or overdue automation. `finance/domain/RentCycleTbl.java:22-46` |
| `RentCycleChargeTbl` | Rent-cycle line item | Implemented | Typed amount and description, optional custom config reference. `finance/domain/RentCycleChargeTbl.java:17-37` |
| `ChargeConfigTbl` | Property-level configurable charge | Partially Implemented | Configuration CRUD exists; execution pipeline is disconnected from cycle generation. `finance/domain/ChargeConfigTbl.java:20-60` |
| `MeterReadingTbl` | Monthly utility reading per unit/config | Partially Implemented | Worksheet persistence exists; billing integration is absent. `finance/domain/MeterReadingTbl.java:18-48` |
| `ExpenseGroupTbl` | Unit-level roommate expense group | Partially Implemented | Creation/get exists; no membership model or lifecycle. `finance/domain/ExpenseGroupTbl.java:17-28` |
| `ExpenseTbl` | Shared expense entry | Partially Implemented | Create/list/get service exists; no update/delete/receipt/category entity. `finance/domain/ExpenseTbl.java:19-40` |
| `ExpenseSplitTbl` | Per-user expense obligation | Partially Implemented | Amount/status/paidAt exist; settlement is only a status flip. `finance/domain/ExpenseSplitTbl.java:21-46` |

### DTOs

| DTO family | Status | Notes |
|---|---|---|
| `LeaseDTOs` | Implemented | Create/response only; no update, terminate, renew, or deposit DTOs. |
| `RentCycleDTOs` | Implemented | Generate/response/charge DTOs; no payment, cancellation, or adjustment DTOs. |
| `ChargeConfigDTOs` | Partially Implemented | Request has no Bean Validation annotations. |
| `MeterReadingDTOs` | Partially Implemented | Request has no Bean Validation annotations or reading-range constraints. |
| `ExpenseGroupDTOs` | Implemented | Create/response only. |
| `ExpenseDTOs` | Implemented | Create/response only. |
| `ExpenseSplitDTOs` | Partially Implemented | Generation/response exists; participant amount and percentage lack positivity constraints. |

References: `finance/dto/LeaseDTOs.java`, `RentCycleDTOs.java`, `ChargeConfigDTOs.java`, `MeterReadingDTOs.java`, `ExpenseGroupDTOs.java`, `ExpenseDTOs.java`, `ExpenseSplitDTOs.java`.

### Controllers

Seven Finance controllers are implemented:

- `LeaseController`: create, get, delete.
- `RentCycleController`: generate, list, mark paid.
- `ChargeConfigController`: create, update, deactivate, list by property, get.
- `MeterReadingController`: initialize/read worksheet, batch save.
- `ExpenseGroupController`: create, get.
- `ExpenseController`: create, list.
- `ExpenseSplitController`: generate, my dues, settle.

References: `finance/controller/*.java`.

### Services

| Service | Status | Key limitation |
|---|---|---|
| `LeaseServiceImpl` | Partially Implemented | Creates and hard-deletes leases; no update/renew/end workflow. |
| `RentCycleServiceImpl` | Partially Implemented | Manual generation and binary paid transition only. |
| `ChargeConfigServiceImpl` | Partially Implemented | CRUD is not connected to rent-cycle generation. |
| `MeterReadingServiceImpl` | Partially Implemented | Saves worksheets but never converts consumption to a charge. |
| `ExpenseGroupServiceImpl` | Partially Implemented | Create/get only; accepts client-supplied creator ID. |
| `ExpenseServiceImpl` | Partially Implemented | Create/get/list only; accepts client-supplied creator ID. |
| `ExpenseSplitServiceImpl` | Partially Implemented | Generates obligations and marks them settled without a transaction record. |

### Repositories

Eight Spring Data repositories exist and are used:

`LeaseRepository`, `RentCycleRepository`, `RentCycleChargeRepository`, `ChargeConfigRepository`, `MeterReadingRepository`, `ExpenseGroupRepository`, `ExpenseRepository`, and `ExpenseSplitRepository`.

Status: **Implemented as persistence adapters, but repository design is not aggregate-oriented.** Services independently save child records and other modules consume Finance entities through Finance service methods.

### Strategies

| Strategy | Status | Evidence |
|---|---|---|
| Equal expense split | Implemented | Handles rounding remainder. `EqualExpenseSplitStrategy.java:29-36` |
| Percentage expense split | Implemented | Requires total percentage = 100. `PercentageExpenseSplitStrategy.java:31-48` |
| Fixed/custom amount split | Implemented | Requires amounts equal expense total. `AmountExpenseSplitStrategy.java:28-45` |
| Rotational expense split | Partially Implemented | Always assigns the current expense to the first participant; no persisted rotation state. `RotationalExpenseSplitStrategy.java:27-35` |
| Fixed-rate charge calculation | Implemented but disconnected | Returns configured base rate. `FixedRateCalculation.java:18-20` |
| Metered calculation | Stub | Uses hard-coded `150.00`, not `MeterReadingRepository`. `MeteredCalculation.java:12-29` |
| Sales-tax decorator | Stub/Needs Refactor | Hard-coded 5% rate. `SalesTaxDecorator.java:18-22` |
| Late-fee decorator | Partially Implemented | Percentage calculation exists but no due-date trigger or persistence flow. `LateFeeDecorator.java:18-25` |
| Charge factory/pipeline | Partially Implemented | Builds strategies/decorators but has no caller in cycle generation. `ChargeCalculationService.java:24-48` |

### Events, Schedulers, Mappers, Validators

| Type | Status |
|---|---|
| Finance events | **Not Implemented.** No Finance `ApplicationEvent`, publisher, or listener exists. |
| Finance schedulers | **Not Implemented.** No Finance `@Scheduled` code exists. |
| Mappers | **Implemented** for lease, rent cycle, expense group, expense, and expense split. Charge config and meter readings map inline. |
| Custom Finance validators | **Not Implemented.** Validation is spread across DTO annotations and service conditionals. |
| Bean Validation | **Partially Implemented.** Lease/rent/expense DTOs have basic constraints; charge config and meter reading requests do not. |

No direct Finance test class was found under `backend/src/test`. Existing tests only use `LeaseTbl` as setup for another module.

## Finance Capability Matrix

| Capability | Status | Actual implementation evidence |
|---|---|---|
| Lease Management | Partially Implemented | Create/get/delete and occupancy queries only. |
| Lease Creation | Implemented | `LeaseServiceImpl.java:42-71` |
| Lease Update | Not Implemented | No service or API. |
| Lease Termination | Partially Implemented | `DELETE` physically removes the lease instead of ending it. `LeaseServiceImpl.java:116-130` |
| Lease Renewal | Not Implemented | No model, service, or API. |
| Move In | Partially Implemented | Move-in date and capacity checks exist; no explicit workflow/event. |
| Move Out | Partially Implemented | Optional date exists; no move-out action, settlement, or final proration. |
| Rent Cycle Engine | Partially Implemented | Manual cycle creation and simple status exist. |
| Rent Cycle Creation | Implemented | Persists cycle and charges. `RentCycleServiceImpl.java:37-74` |
| Rent Cycle Generation | Implemented | Manual API only. |
| Rent Cycle Status Management | Partially Implemented | PENDING and PAID are set; OVERDUE is never assigned automatically. |
| Due Date Management | Implemented | Due date accepted and stored. |
| Rent Cycle Cancellation | Not Implemented | No status or API. |
| Rent Cycle Charges | Implemented | Line-item table/entity and response breakdown. |
| Charge Breakdown Support | Implemented | `RentCycleMapper.java:13-39` |
| Rent Charges | Implemented | Base rent is copied from lease. |
| Maintenance Charges | Implemented | Supported as manually supplied typed line item. |
| Electricity Charges | Partially Implemented | Manual type and meter worksheet exist; no automatic calculation linkage. |
| Water Charges | Not Implemented | No charge enum/category dedicated to water. |
| Penalty Charges | Implemented | Manual `PENALTY` line item is supported. |
| Discount Charges | Partially Implemented | Type exists, but all amounts are added; no rule requires a negative discount. `RentCycleServiceImpl.java:43-44,109-115` |
| Payment Engine | Partially Implemented | Only `markPaid`; no payment transaction. |
| Payment Entity | Not Implemented | SaaS `PaymentTransactionTbl` is unrelated to rent cycles. |
| Payment Ledger | Not Implemented | No rent ledger table/entity. |
| Multiple Payments Per Rent Cycle | Not Implemented | No payment relationship. |
| Payment Audit Trail | Not Implemented | `paidAt` and application logs are not an immutable payment audit trail. |
| Cash Payments | Not Implemented | No method field or workflow. |
| UPI Payments | Not Implemented | No method field or workflow. |
| Bank Transfer Payments | Not Implemented | No method field or workflow. |
| Razorpay Integration | Not Implemented | Only an enum value exists in SaaS billing; no Razorpay service bean and no rent linkage. |
| Refund Support | Not Implemented | No model or API. |
| Partial Payments | Not Implemented | Binary cycle status only. |
| Paid Amount Tracking | Not Implemented | No paid amount column. |
| Remaining Amount Tracking | Not Implemented | No balance column/calculation. |
| Partial Payment Status | Not Implemented | Enum only has PENDING/PAID/OVERDUE. |
| Security Deposit | Partially Implemented | Lease stores one amount only. |
| Deposit Collection | Not Implemented | No transaction/state. |
| Deposit Refund | Not Implemented | No transaction/state. |
| Deposit Deduction | Not Implemented | No deduction model/reason/evidence. |
| Late Fee Engine | Partially Implemented | Disconnected percentage decorator exists. |
| Fixed Penalty Strategy | Not Implemented | No fixed late-penalty strategy. |
| Percentage Penalty Strategy | Partially Implemented | Calculation exists but is not triggered or persisted by billing flow. |
| Automatic Penalty Generation | Not Implemented | No scheduler/event/use of due date. |
| Auto Rent Generation | Not Implemented | Manual API only. |
| Scheduler Based | Not Implemented | No Finance scheduler. |
| Event Based | Not Implemented | No Finance events. |
| Lease Creation Based | Not Implemented | Lease creation does not publish/generate a cycle. |
| Prorated Rent | Not Implemented | Full lease rent is always used. |
| Mid-Month Move In | Partially Implemented | Date can be stored; billing remains full amount. |
| Mid-Month Move Out | Partially Implemented | Date can be stored; no final-cycle adjustment. |
| Rent Revision | Not Implemented | No history/effective-date model. |
| Rent Escalation | Not Implemented | No rule or job. |
| Annual Rent Revision | Not Implemented | No rule or job. |
| Shared Living Features | Partially Implemented | Expense groups/splits exist; membership and net balances do not. |
| Rent Sharing | Partially Implemented | `ExpenseType.RENT` and lease split enum exist, but lease split strategy is unused. |
| Roommate Contributions | Partially Implemented | Obligations can be settled, but contributions/payments are not recorded. |
| Split Rent Strategies | Implemented | Equal, percentage, fixed/custom, rotational calculations exist for expenses. |
| Expense Management | Partially Implemented | Create/list only. |
| Expense Entity | Implemented | `ExpenseTbl`. |
| Expense Categories | Implemented | Enum-backed categories. |
| Expense Splitting | Implemented | Strategy-based split generation. |
| Settlement Engine | Partially Implemented | Marks one split settled without money movement or counterparty. |
| Internal Balance Tracking | Partially Implemented | Pending dues can be queried; no net per-user balance. |
| Roommate Settlement | Partially Implemented | Per-split status transition only. |
| Splitwise Style Flow | Partially Implemented | Expenses and obligations exist; no simplify-debts, netting, payer/creditor ledger, or settlement transaction. |
| Analytics | Not Implemented | No Finance analytics service/API. |
| Revenue Analytics | Not Implemented | No aggregation/API. |
| Collection Analytics | Not Implemented | No payment data to aggregate. |
| Occupancy Analytics | Not Implemented in Finance | Active-lease queries exist for other screens, not an analytics capability. |

## Database Audit

### Finance Tables

| Table | Purpose | Status |
|---|---|---|
| `lease_tbl` | Lease/occupancy agreement | Partially Implemented |
| `rent_cycle_tbl` | Monthly rent obligation | Partially Implemented |
| `rent_cycle_charge_tbl` | Cycle charge breakdown | Partially Implemented |
| `charge_config_tbl` | Configurable property charges | Partially Implemented |
| `meter_reading_tbl` | Unit utility readings | Partially Implemented |
| `expense_group_tbl` | Roommate expense grouping | Partially Implemented |
| `expense_tbl` | Shared expense header | Partially Implemented |
| `expense_split_tbl` | Per-user expense obligation | Partially Implemented |

Schema references: `V1__init_schema.sql:54-79`, `V9__billing_and_shared_expense_domains.sql:6-93`, `V11__add_custom_charge_configuration.sql:1-21`, `V15__add_meter_reading_table.sql:1-23`.

### Unused or Effectively Unused Data

- `lease_tbl.split_strategy` is persisted but never used by lease billing or rent-cycle generation.
- `rent_cycle_charge_tbl.charge_config_id` is modeled, but `RentCycleServiceImpl` never uses charge configs or `ChargeCalculationService`.
- `meter_reading_tbl.is_billed` is checked but never set to `true`.
- `charge_config_tbl.billing_frequency`, `unit_type`, tax, and late-fee settings are stored, but no production billing orchestration consumes them.
- `RentCycleStatus.OVERDUE` exists in Java/database but no code sets it.

No whole Finance table is completely unreachable: all eight have an entity/repository or migration use. Several tables are only partially operational as described above.

### Missing Tables

Required for production-grade behavior but absent from current code:

- Rent payment transaction and payment allocation tables.
- Immutable rent ledger/journal entries.
- Refund table.
- Security-deposit transaction, deduction, and refund tables.
- Lease/rent revision history with effective dates.
- Rent-cycle adjustment/credit-note table.
- Roommate settlement transaction and net-balance ledger.
- Payment webhook/idempotency record tied to rent payments.
- Finance outbox/event table if reliable asynchronous processing is required.

### Duplicate Responsibilities and Naming

- `rent_cycle_tbl` represents owner receivables while `expense_tbl` may also use `ExpenseType.RENT`. The migration comments document separation, but APIs do not prevent duplicate user-facing rent records.
- `payment_transaction_tbl` exists under SaaS billing and is easy to mistake for tenant rent payment. It has no `rent_cycle_id` and must not be reused without an explicit bounded-context redesign.
- Entity names ending in `Tbl` leak storage naming into the domain model and make entities look like persistence records rather than domain concepts.
- `ExpenseGroupController` uses `/finance/groups`, which is vague; `/expense-groups` is clearer.
- `ExpenseSplitController` uses `/finance/splits`, which is also broader than its actual responsibility.

### Schema Defects and Scalability Risks

1. **Enum mismatch:** `RentChargeType.CUSTOM` exists in Java, and `ChargeCalculationService` creates it, but migration V9 defines the MySQL enum without `CUSTOM`. V11 adds only `charge_config_id`. Custom charge persistence can fail.
2. **History deletion:** `rent_cycle_tbl.lease_id` has `ON DELETE CASCADE`, and lease deletion is exposed as termination. Financial history can be erased.
3. **Money precision:** most money uses `DECIMAL(10,2)`, which may be too small for portfolio-level totals and gives no currency column.
4. **No optimistic locking:** Finance entities have no `@Version`, so concurrent status/amount changes can overwrite each other.
5. **String billing month:** rent/expense use `CHAR(7)` while meter readings use separate integer month/year, producing inconsistent period models.
6. **No check constraints:** negative readings, current reading below previous reading, negative rent, invalid percentages, and semantically positive discounts are not protected at database level.
7. **Missing indexes:** likely query paths lack composite indexes such as lease status/date, property charge active state, and expense group plus billing month.
8. **N+1/query scaling:** rent-cycle list loads charges with one repository call per cycle. `RentCycleServiceImpl.java:89-93,118-120`.
9. **Unbounded list APIs:** rent cycles and expenses use `findAll()` and return unpaginated lists.
10. **Migration drift warning:** the test run reported database schema version 21 while the repository's latest migration is 20. This environment contains migration state not represented in the repository.

## API Audit

| API | Purpose | Status |
|---|---|---|
| `POST /api/v1/finance/leases` | Create lease | Implemented |
| `GET /api/v1/finance/leases/{id}` | Get lease | Needs Refactor |
| `DELETE /api/v1/finance/leases/{id}` | Delete/"terminate" lease | Needs Refactor |
| `POST /api/v1/finance/rent-cycles/generate` | Generate cycle | Implemented |
| `GET /api/v1/finance/rent-cycles` | List/filter cycles | Needs Refactor |
| `POST /api/v1/finance/rent-cycles/{id}/mark-paid` | Binary paid transition | Needs Refactor |
| `POST /api/v1/finance/charge-configs` | Create charge config | Needs Refactor |
| `PUT /api/v1/finance/charge-configs/{id}` | Update charge config | Needs Refactor |
| `DELETE /api/v1/finance/charge-configs/{id}` | Soft-deactivate config | Implemented |
| `GET /api/v1/finance/charge-configs/property/{propertyId}` | List active configs | Needs Refactor |
| `GET /api/v1/finance/charge-configs/{id}` | Get active config | Needs Refactor |
| `GET /api/v1/finance/meter-readings/worksheet` | Get/create monthly worksheet | Needs Refactor |
| `POST /api/v1/finance/meter-readings/batch-save` | Save readings | Needs Refactor |
| `POST /api/v1/finance/groups` | Create expense group | Needs Refactor |
| `GET /api/v1/finance/groups/{id}` | Get expense group | Needs Refactor |
| `POST /api/v1/finance/expenses` | Create expense | Needs Refactor |
| `GET /api/v1/finance/expenses` | List expenses | Needs Refactor |
| `POST /api/v1/finance/splits/generate` | Generate splits | Needs Refactor |
| `GET /api/v1/finance/splits/my-dues` | Authenticated user's pending dues | Implemented |
| `POST /api/v1/finance/splits/{id}/settle` | Mark split settled | Needs Refactor |

### Why APIs Need Refactor

- Resource authorization is not tied to property/lease/group ownership. `hasRole` checks alone do not prevent cross-property reads or writes.
- `createdBy` is accepted from expense/group request bodies instead of the authenticated principal.
- A tenant-level `USER` can call split generation and settle any split ID if they can discover it; there is no ownership check.
- Lease deletion should become a terminate/end command and preserve records.
- Rent cycle paid status should be derived from recorded payments and allocations.
- List APIs need pagination, sorting, indexed combined filters, and tenant/property scoping.
- Charge config and meter DTOs need validation and controllers need `@Valid`.
- Meter worksheet creation is performed by `GET`, making a nominally safe/idempotent read endpoint write data.
- Missing APIs include lease update/end/renew, cycle get/cancel/recalculate, payments/refunds, deposit transactions, revisions, settlements, and analytics.

## Domain Model and DDD Audit

### What Aligns with DDD

- Owner rent billing and roommate shared expenses are explicitly separated in migration comments and controller descriptions.
- Services form application-layer entry points and repositories are not injected directly into controllers.
- Expense split algorithms use a strategy abstraction.
- Charge calculations use strategy/decorator abstractions.

### Aggregate Boundaries

Expected aggregate candidates from the current model:

- `Lease` aggregate: lease lifecycle and rent terms.
- `RentCycle` aggregate: cycle plus charge lines and payment allocations.
- `ChargeConfig` aggregate: property charge policy.
- `ExpenseGroup` aggregate: membership and shared expenses.
- `Expense` aggregate: expense plus splits.
- `MeterReading` aggregate or value stream keyed by unit/config/period.

Current violations:

1. `RentCycleServiceImpl` saves the cycle and each child charge through separate repositories. The cycle does not own or enforce charge invariants in the entity.
2. `ExpenseSplitServiceImpl` manipulates split children directly through `ExpenseSplitRepository`, outside an `Expense` aggregate root.
3. Entities are anemic mutable JPA records with public setters and no domain methods/invariants.
4. Status transitions are unrestricted: paid/settled calls are repeatable and do not validate prior state.
5. Lease deletion bypasses lifecycle invariants and destroys dependent aggregate history.

### Entity Ownership and Cross-Module Dependencies

- Finance entities directly reference Property entities (`UnitTbl`, `PropertyTbl`).
- Finance services call Property repositories directly in `ChargeConfigServiceImpl` and `MeterReadingServiceImpl`, bypassing Property application services.
- `MeterReadingServiceImpl` directly uses `UnitRepository`, `PropertyRepository`, `LeaseRepository`, and `UserService`, creating a broad orchestration dependency.
- Other modules consume `LeaseTbl` directly through `LeaseService`, exposing a Finance persistence entity as a cross-module contract.
- `LeaseTbl.userId`, `ExpenseTbl.createdBy`, and split user IDs are raw UUIDs while property/unit are JPA associations, yielding inconsistent boundary modeling.

### Service Communication and Repository Leakage

- There is no event-driven Finance communication; all interactions are synchronous.
- Repositories are not exposed from controllers, but domain entities are returned from service interfaces (`LeaseService`, `ExpenseService`, `ExpenseGroupService`). This leaks persistence models across application/module boundaries.
- Finance service interfaces mix command use cases with query helpers used by other modules.
- `ChargeConfigServiceImpl` uses `PropertyRepository` directly instead of a Property port/service.

### DDD Verdict

**Partially aligned, not domain-driven.** The package structure and strategy patterns are useful, but the implemented model is primarily transaction-script services over anemic JPA entities. Aggregate invariants, domain events, value objects, lifecycle methods, module contracts, and durable financial journals are absent.

## Architecture and Correctness Gaps

### Critical

- Hard lease deletion plus cascading rent-cycle deletion destroys financial history.
- No object-level authorization/property scoping on Finance records.
- No rent-payment/ledger model; `markPaid` is unauditable and cannot support real reconciliation.
- Java/database `CUSTOM` charge enum mismatch.

### High

- Client-controlled `createdBy` fields permit attribution spoofing.
- Metered calculation is hard-coded and disconnected.
- Discount amounts are added with no sign/invariant enforcement.
- No idempotency for payment-like commands or settlement actions.
- No Finance tests cover calculations, authorization, persistence, or lifecycle behavior.
- No automatic overdue transition or late-fee generation.

### Medium

- Unpaginated, in-memory filtered list APIs.
- N+1 charge loading for rent-cycle lists.
- No currency model, optimistic locking, check constraints, or immutable audit journal.
- Charge config errors throw generic `IllegalArgumentException`/`IllegalStateException`, inconsistent with API error handling.
- Meter worksheet silently skips billed rows and missing current readings rather than returning per-row outcomes.
- Rotational split is not actually rotational across expenses.

## Gap Analysis

### Already Implemented

- Lease creation with capacity/date validation and tenant-role assignment.
- Manual rent-cycle creation with unique lease/month constraint.
- Base rent and charge breakdown persistence.
- Manual paid transition.
- Configurable-charge CRUD and calculation abstractions.
- Meter-reading worksheet persistence.
- Shared expense groups, expenses, split generation, pending dues, and simple settlement.
- Equal, percentage, fixed/custom, and nominal rotational split strategies.
- Basic DTO validation, role annotations, transactions, logs, and Flyway schema.

### Must Build Next

- Preserve lease and financial history: replace delete with lifecycle termination.
- Resource-scoped authorization for every Finance command/query.
- Rent payment, allocation, method/reference, ledger, and idempotency model.
- Partial payments and derived cycle balances/status.
- Fix custom-charge schema mismatch and connect charge configs/meter readings to cycle generation.
- Correct discount and money invariants.
- Finance unit/integration/security tests.
- Automated overdue processing and production late-fee rules.

### Can Wait

- Deposit collection/refund/deduction workflows after core ledger semantics are stable.
- Lease renewal and rent-revision history.
- Proration for move-in/move-out.
- Rich roommate netting and consolidated settlement.
- Finance reporting and exports.

### Future Enhancements

- Razorpay/UPI/bank webhook integrations.
- Credit notes, refunds, reversals, charge disputes, and reconciliation.
- Event/outbox-based invoice, payment, and notification workflows.
- Multi-currency and tax jurisdiction support.
- Revenue forecasting, collection cohorts, aging, occupancy, and delinquency analytics.
- Automated rent escalation and configurable billing calendars.

## Three-Sprint Plan

### Sprint 1: Financial Integrity and Payment Foundation

1. Replace lease delete with `endLease` status/date transition; remove cascade-based history destruction.
2. Add property/tenant authorization policies to all Finance APIs; derive actor IDs from authentication.
3. Add `rent_payment_tbl`, `payment_allocation_tbl`, payment method/status/reference/idempotency fields, and immutable ledger entries.
4. Replace `markPaid` with record-payment behavior; calculate paid and remaining amounts and PENDING/PARTIALLY_PAID/PAID status.
5. Fix `CUSTOM` charge schema, discount sign rules, validation, currency/precision decisions, and optimistic locking.
6. Add focused tests for lease lifecycle, rent generation, charge totals, payment allocation, duplicate commands, and authorization.

**Sprint 1 exit condition:** no destructive financial-history path; auditable full/partial payment recording; scoped access; passing Finance tests.

### Sprint 2: Automated Billing and Lease Lifecycle

1. Connect charge configs and real meter consumption to rent-cycle generation.
2. Add scheduler-based idempotent cycle generation and overdue transitions.
3. Implement fixed and percentage late-fee policies with one-time/repeat rules.
4. Add lease update/end/renew and effective-dated rent revisions.
5. Add move-in/move-out proration and final-cycle handling.
6. Add security-deposit collection, deductions, refunds, and ledger postings.

**Sprint 2 exit condition:** monthly billing can run automatically from lease/config/meter data and produce auditable balances.

### Sprint 3: Shared-Living and Differentiators

1. Add expense-group membership, payer/creditor semantics, settlement transactions, and net balances.
2. Implement true rotational state and debt simplification.
3. Add Razorpay/UPI/bank integrations with signed webhooks, retries, idempotency, reconciliation, and refunds.
4. Add revenue, collections, aging, occupancy, and shared-expense analytics.
5. Add event/outbox workflows and notifications for invoices, due dates, overdue balances, and settlements.

**Sprint 3 exit condition:** production-grade collection automation plus differentiated shared-living settlement and analytics.

## Recommended Next Sprint

Proceed with Sprint 1. The current module should not add more charge types or analytics before it has non-destructive lease lifecycle, resource authorization, and an auditable payment/ledger foundation. Those three concerns determine whether every later Finance feature is reliable.

## Verification

Command run:

```text
mvn -f backend/pom.xml test
```

Result: **BUILD SUCCESS**, 5 tests passed. No direct Finance tests were present. The run used the configured MySQL database and emitted a Flyway warning that the database schema version is 21 while this checkout's latest migration is 20.
