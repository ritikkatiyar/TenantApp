# Tenant Living Backend - Phase Wise Plan

## Phase 0 - Backend Foundation

Status: Done

Completed:

- Created Spring Boot backend project under `backend/`.
- Configured Maven with Java 21.
- Added required backend dependencies.
- Created modular monolith package structure.
- Added MySQL configuration.
- Added JPA validation mode.
- Enabled Flyway.
- Added initial empty migration.
- Added public health endpoint.
- Added minimal security configuration.
- Verified build successfully.

Deliverables:

- `backend/pom.xml`
- `backend/src/main/resources/application.yml`
- `backend/src/main/java/com/tenantliving/TenantLivingApplication.java`
- `backend/src/main/java/com/tenantliving/common/health/HealthController.java`
- `backend/src/main/java/com/tenantliving/config/SecurityConfig.java`
- `backend/src/main/resources/db/migration/V1__init.sql`

## Phase 1 - Core Platform Hardening

Status: Done

Completed:

- Add standard API error response format.
- Add global exception handling.
- Add request validation support.
- Add Docker Compose support for local MySQL.
- Add environment-specific configuration profiles.
- Add CORS policy.
- Add structured logging conventions.
- Add tests with real feature development.

Notes:

- Temporary platform-only tests were intentionally not kept.
- Feature tests will be added when real Auth, Property, and Room behavior is implemented.

## Phase 2 - Auth Module

Status: Planning

Planned:

- Discuss and document schema.
- Discuss and document low-level design.
- Define authentication requirements.
- Add user/account domain model after requirements are finalized.
- Add Flyway migrations for auth tables.
- Add password encoding.
- Add login and token strategy.
- Add role or permission model if required.

## Phase 3 - Property Module

Status: Not started

Planned:

- Define property domain requirements.
- Add property entity and repository after schema decisions.
- Add Flyway migration for property tables.
- Add service layer.
- Add REST endpoints.
- Add validation and tests.

## Phase 4 - Room Module

Status: Not started

Planned:

- Define room domain requirements.
- Add room entity and repository after schema decisions.
- Add Flyway migration for room tables.
- Add service layer.
- Add REST endpoints.
- Add validation and tests.

## Phase 5 - Production Readiness

Status: Not started

Planned:

- Add Docker support if needed.
- Add CI build workflow.
- Add database migration checks.
- Add actuator or production health endpoints if required.
- Add observability setup.
- Add deployment configuration.

## Tracking Rules

- Update this file at the end of every meaningful implementation phase.
- Keep completed items concrete and tied to committed code.
- Do not mark future domain work as done until entities, migrations, APIs, and tests exist.
- Keep phase scope small enough that each phase can be reviewed independently.
