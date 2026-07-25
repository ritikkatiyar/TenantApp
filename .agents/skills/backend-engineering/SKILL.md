---
name: backend-engineering
description: "Modular monolith architecture, package-by-feature, DDD-lite, database table/column naming, Flyway migrations, API response envelopes, pagination, structured logging, and performance standards for Spring Boot."
---

# Senior Backend Engineer - Production-Grade Spring Boot Standards

Before generating or modifying any code, STRICTLY follow the engineering standards defined below.

---

## ARCHITECTURE STANDARD

* Architecture: Modular Monolith
* Pattern:
  * Package-by-feature
  * Layered architecture
  * DDD-lite

Module structure:
module/
├── controller/
├── service/
│   ├── interface/
│   └── impl/
├── domain/
├── repository/
├── dto/
├── mapper/

---

## MODULE BOUNDARY RULES

* **Bounded Contexts Only**: Modules must be organized by Domain (Bounded Contexts), NOT by individual database tables (Entity Services).
* Approved Top-Level Modules:
  1. `auth` - Identity & Access Management (Logins, Tokens).
  2. `user` - Core User Profile and Global Roles.
  3. `property` - Real Estate / Asset Management (Properties, Units, Layouts, Property Roles).
  4. `finance` - Tenancy & Financials (Leases, Rent Cycles, Expenses, Splits).
  5. `common` / `config` - Cross-cutting concerns.
* No direct repository access across modules
* Modules communicate ONLY via service interfaces
* Controllers must remain thin
* Business logic only inside services

---

## DATABASE STANDARDS

1. Table naming:
* lowercase + "_tbl"
  Example: user_tbl, property_tbl

2. Column naming:
* snake_case

3. Primary keys:
* UUID only

4. Foreign keys:
* *_id format

5. Flyway:
* schema changes ONLY via migrations
* Never use ddl-auto=create/update

---

## API STANDARDS

Standard response format:
{
"success": true,
"data": {},
"error": null
}

Rules:
* **Domain-Prefixed Paths**: All API endpoints MUST be prefixed with the domain name (e.g., `/api/v1/finance/leases`, `/api/v1/property/properties`).
* Never expose entities directly
* Use DTOs for all APIs
* Use validation annotations
* Use proper HTTP status codes

---

## LOGGING & OBSERVABILITY

1. Structured JSON logging
2. Correlation ID required
3. Micrometer tracing enabled
4. Do NOT log:
* passwords
* tokens
* request bodies

Include in logs:
* correlationId
* traceId
* spanId

---

## NAMING CONVENTIONS

Classes:
* UserService
* UserServiceImpl
* CreatePropertyRequest
* PropertyResponse

Avoid:
* Utils
* CommonService
* GenericManager

---

## SECURITY RULES

* JWT-based auth
* Passwords must use BCrypt
* Never trust userId from request body
* Extract authenticated user from JWT

---

## DATA ACCESS & PERFORMANCE RULES

* **No Repository Calls in Loops**: Repository methods (e.g., `save`, `find`, `exists`, `delete`) must NEVER be called inside loops (`for`, `while`) or lambda iteration blocks (like `.forEach()`, `.map()`).
  * Fetch required data in bulk outside the loop using `IN` queries (e.g., `findAllByXIn()`).
  * Cache, lookup, and associate data in-memory using Maps or Sets.
  * Batch execute database modifications (e.g., `saveAll()`, `deleteAll()`) outside the loop.
* **Mandatory Pagination for Dynamic Lists**: Any query or endpoint returning collections that grow dynamically over time (e.g., Ledger entries, Expenses, Rent Cycles, Announcements, Audit logs) MUST implement pagination using Spring's `Pageable` and return `Page<T>` instead of raw lists (`List<T>`).
* **Decoupled CRUD Service Layer**: Direct repository injection in high-level business services is discouraged. Abstraction interfaces (`CrudService<T, ID>`) and domain CRUD services (e.g., `UserCrudService`) must be used to wrap direct database repository calls.

---

## CODE QUALITY RULES

* No commented-out code
* No dead code
* No duplicate logic
* Keep methods small and readable
* Use constructor injection only
* **Clean Import Styling**: Never use fully-qualified inline declarations for standard utility and time packages (e.g., `java.util.List`, `java.util.Map`, `java.time.LocalDate`). Always declare standard `import` statements at the top of the file and use simple class names in the code body.
* **Service-DTO Decoupling & Mapper Conventions**: To maintain pure business logic in service implementations, DTO-to-entity and entity-to-DTO conversion must be decoupled from the service layer and delegated to dedicated, stateless mapper utility classes.
  * Mappers must follow the naming pattern `<DomainName>Mapper` (e.g., `LeaseMapper`) and define a `private` constructor to prevent instantiation.
  * DTO-to-Entity mapping methods must be named `toEntity(...)` (accepting custom type-safe arguments for contextual domain dependencies like unit/property entities).
  * Entity-to-DTO mapping methods must be named `toResponse(...)`.
  * Generic mapper interfaces must not be used to avoid destroying compile-time type safety for custom contextual parameters.

---

## TESTING RULES

* Every phase must:
  * compile successfully
  * run successfully
  * expose working APIs

---

## IMPORTANT

This project follows FAANG-grade engineering discipline.

Prioritize:
* clarity
* maintainability
* scalability
* observability

Do NOT overengineer.
Do NOT introduce unnecessary abstractions.
