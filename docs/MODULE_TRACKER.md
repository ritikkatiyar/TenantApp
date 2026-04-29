# Tenant Living Backend - Module Tracker

## Module Status

| Module | Package | Status | Notes |
| --- | --- | --- | --- |
| Application Bootstrap | `com.tenantliving` | Done | Main Spring Boot application class created. |
| Configuration | `com.tenantliving.config` | Started | Basic security configuration added. |
| Common | `com.tenantliving.common` | Started | Shared package created. Health endpoint lives under common health. |
| Common Exceptions | `com.tenantliving.common.exception` | Started | Added API error model, field error details, business exception base, and global exception handler. |
| Auth | `com.tenantliving.auth` | Placeholder | Package created. No business logic yet. |
| Property | `com.tenantliving.property` | Placeholder | Package created. No business logic yet. |
| Room | `com.tenantliving.room` | Placeholder | Package created. No business logic yet. |
| Database Migration | `src/main/resources/db/migration` | Started | Initial Flyway migration created with empty schema. |

## Module Guidelines

### Common

Use this module only for cross-cutting backend concerns such as:

- Shared exceptions
- Shared error response models
- Utility classes
- Health or platform endpoints

Avoid placing domain-specific logic here.

### Config

Use this module for application-wide Spring configuration, such as:

- Security
- CORS
- Web configuration
- Persistence configuration
- Object mapping configuration

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
