# Tenant Living Backend - Detailed Work Log

## 2026-04-28 - Backend Foundation

### Project Scaffold

Created a Spring Boot backend project inside the monorepo at:

```text
backend/
```

The project is configured as:

- Name: `tenant-living-backend`
- Group: `com.tenantliving`
- Artifact: `tenant-living-backend`
- Java version: `21`
- Packaging: `jar`
- Build tool: `Maven`

### Maven Configuration

Created:

```text
backend/pom.xml
```

Added dependencies for:

- Spring Boot Web MVC
- Spring Data JPA
- Spring Security
- MySQL Connector/J
- Lombok
- Flyway Core
- Flyway MySQL support
- Spring Boot Test
- Spring Security Test

Added build plugin support for:

- Maven compiler
- Lombok annotation processing
- Spring Boot Maven packaging

### Application Configuration

Created:

```text
backend/src/main/resources/application.yml
```

Configured:

- Application name
- MySQL datasource
- Environment-variable overrides for database URL, username, and password
- JPA Hibernate validation mode
- Disabled Open Session in View
- Flyway migration location
- Server port override

Important JPA setting:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

This keeps schema ownership with Flyway instead of Hibernate.

### Main Application Class

Created:

```text
backend/src/main/java/com/tenantliving/TenantLivingApplication.java
```

This is the Spring Boot entry point for the backend service.

### Modular Package Structure

Created the base modular monolith package layout:

```text
backend/src/main/java/com/tenantliving/
  auth/
  common/
  common/exception/
  common/health/
  config/
  property/
  room/
```

Empty module packages are currently represented with `package-info.java` files so the intended structure is preserved before implementation begins.

### Health Endpoint

Created:

```text
backend/src/main/java/com/tenantliving/common/health/HealthController.java
```

Endpoint:

```http
GET /health
```

Response:

```text
OK
```

### Security Setup

Created:

```text
backend/src/main/java/com/tenantliving/config/SecurityConfig.java
```

Current behavior:

- `GET /health` is public.
- All other requests require authentication.
- HTTP Basic is enabled as a minimal placeholder.
- CSRF is disabled for the current API-only foundation.

This is intentionally minimal and should be revisited when real authentication is implemented.

### Flyway Setup

Created:

```text
backend/src/main/resources/db/migration/V1__init.sql
```

The migration is intentionally empty because no domain tables have been introduced yet.

### Verification

Ran:

```bash
mvn -f backend/pom.xml test
```

Result:

```text
BUILD SUCCESS
```

No tests exist yet, but the project compiles and dependencies resolve successfully.

## Open Notes

- Authentication module is scaffolded but not implemented.
- Property module is scaffolded but not implemented.
- Room module is scaffolded but not implemented.
- No database tables exist yet.
- No domain model has been introduced yet.

## 2026-04-29 - Phase 1 Platform Error Handling

### Validation Support

Updated:

```text
backend/pom.xml
```

Added:

```text
spring-boot-starter-validation
```

This enables Jakarta Bean Validation for future request DTOs and controller parameters.

### Common API Error Model

Created:

```text
backend/src/main/java/com/tenantliving/common/exception/ApiError.java
backend/src/main/java/com/tenantliving/common/exception/FieldErrorDetail.java
```

The standard error response now carries:

- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `fieldErrors`

### Business Exception Base

Created:

```text
backend/src/main/java/com/tenantliving/common/exception/BusinessException.java
```

This gives future modules a simple way to raise expected domain/API errors with an explicit HTTP status.

### Global Exception Handling

Created:

```text
backend/src/main/java/com/tenantliving/common/exception/GlobalExceptionHandler.java
```

Currently handles:

- Request body validation errors
- Constraint validation errors
- Business exceptions
- Missing API resources
- Access denied errors
- Unexpected server errors

Unexpected errors return a generic message instead of exposing internal exception details.

### Verification

Ran:

```bash
mvn -f backend/pom.xml test
```

Result:

```text
BUILD SUCCESS
```
