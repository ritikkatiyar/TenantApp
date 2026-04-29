# Tenant Living Backend - Module Tracker

## Module Status

| Module | Package | Status | Notes |
| --- | --- | --- | --- |
| Application Bootstrap | `com.tenantliving` | Done | Main Spring Boot application class created. |
| Configuration | `com.tenantliving.config` | Started | Security and configurable CORS setup added. |
| Common | `com.tenantliving.common` | Started | Shared package created. Health endpoint lives under common health. |
| Common Exceptions | `com.tenantliving.common.exception` | Started | Added API error model, field error details, business exception base, and global exception handler. |
| Common Logging | `com.tenantliving.common.logging` | Started | Added correlation ID filter and MDC-backed log correlation. |
| Auth | `com.tenantliving.auth` | Placeholder | Package created. No business logic yet. |
| Property | `com.tenantliving.property` | Placeholder | Package created. No business logic yet. |
| Room | `com.tenantliving.room` | Placeholder | Package created. No business logic yet. |
| Database Migration | `src/main/resources/db/migration` | Started | Initial Flyway migration created with empty schema. |
| Local Database Runtime | `docker-compose.yml` | Started | Docker Compose MySQL service added for local development. |
| Environment Profiles | `src/main/resources` | Started | Added common, dev, and prod application configuration files. |
| Schema Planning | `docs/SCHEMA_DESIGN.md` | Draft | Created schema decision tracker before domain tables are added. |
| Low Level Design | `docs/LOW_LEVEL_DESIGN.md` | Draft | Created LLD tracker for module boundaries and implementation rules. |

## Module Guidelines

### Common

Use this module only for cross-cutting backend concerns such as:

- Shared exceptions
- Shared error response models
- Utility classes
- Health or platform endpoints
- Request logging support

Avoid placing domain-specific logic here.

### Config

Use this module for application-wide Spring configuration, such as:

- Security
- CORS
- Web configuration
- Persistence configuration
- Object mapping configuration

Current config classes:

- `SecurityConfig`
- `CorsConfig`
- `CorsProperties`

### Auth

Future home for authentication and authorization concerns.

Potential future responsibilities:

- Login
- Registration
- Token issuing
- Password handling
- User identity integration

No auth business logic has been added yet.

### Property

Future home for property management concerns.

Potential future responsibilities:

- Property records
- Property ownership
- Property address details
- Property availability status

No property business logic has been added yet.

### Room

Future home for room management concerns.

Potential future responsibilities:

- Room records
- Room assignment
- Room rent metadata
- Room availability

No room business logic has been added yet.

## Current API Surface

| Method | Path | Module | Auth | Response |
| --- | --- | --- | --- | --- |
| GET | `/health` | Common Health | Public | `OK` |

## Current Error Surface

Standard error responses use `ApiError`.

Current fields:

- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `fieldErrors`

Handled error categories:

- Validation errors
- Business exceptions
- Missing resources
- Access denied
- Unexpected server errors

## Current Database Surface

No tables exist yet.

Flyway is configured and ready for future migrations.

## Local Database Runtime

Local development uses Docker Compose MySQL.

```bash
docker compose up -d mysql
```

The Spring Boot datasource defaults in `application.yml` match the Compose defaults.

## Current Runtime Profiles

| Profile | File | Purpose |
| --- | --- | --- |
| Common | `application.yml` | Shared application, JPA, Flyway, server, and CORS settings. |
| `dev` | `application-dev.yml` | Local development defaults for Docker MySQL. |
| `prod` | `application-prod.yml` | Production-style environment-variable based configuration. |

Default profile: `dev`

Production should set `SPRING_PROFILES_ACTIVE=prod`.

## Current CORS Surface

CORS is configured through `app.cors` properties.

Default local origins:

- `http://localhost:3000`
- `http://localhost:5173`

## Current Test Surface

No test classes are currently kept.

Testing will be added with real module development.

## Current Logging Surface

Correlation ID support is enabled for all requests.

| Concern | Current Value |
| --- | --- |
| Header | `X-Correlation-Id` |
| MDC key | `correlationId` |
| Override env var | `APP_CORRELATION_HEADER_NAME` |

Console logs include the correlation ID.
