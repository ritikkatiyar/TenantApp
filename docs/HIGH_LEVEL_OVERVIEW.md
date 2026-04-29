# Tenant Living Backend - High Level Overview

## Purpose

This repository contains the backend foundation for the Tenant Living application. The backend is currently scaffolded as a production-ready Spring Boot service under `backend/`.

The current goal is to establish a clean modular monolith base before adding business features.

## Current Backend Setup

- Project name: `tenant-living-backend`
- Location: `backend/`
- Language: Java 21
- Build tool: Maven
- Packaging: Jar
- Framework: Spring Boot
- Database: MySQL
- Local database runtime: Docker Compose MySQL
- Migration tool: Flyway

## Tech Stack

- Spring Web MVC
- Spring Data JPA
- Spring Security
- MySQL Driver
- Lombok
- Flyway
- Maven

## Current Package Layout

```text
com.tenantliving
|-- auth
|-- common
|   |-- exception
|   `-- health
|   `-- logging
|-- config
|-- property
|-- room
`-- TenantLivingApplication.java
```

## Completed Work

- Created the backend Maven project under `backend/`.
- Added Spring Boot application entry point.
- Added modular monolith package structure.
- Added MySQL datasource configuration.
- Configured JPA with `ddl-auto: validate`.
- Enabled Flyway database migrations.
- Added initial empty Flyway migration.
- Added a public `GET /health` endpoint returning `OK`.
- Added basic Spring Security configuration.
- Added validation support.
- Added a common API error response model.
- Added global exception handling for validation, business, not found, access denied, and unexpected errors.
- Added Docker Compose support for local MySQL.
- Added `dev` and `prod` Spring profiles.
- Added configurable CORS support wired into Spring Security.
- Added structured logging pattern with request correlation ID support.
- Verified the project compiles with `mvn -f backend/pom.xml test`.

## Local Database

The project uses Docker Compose for local MySQL.

```bash
docker compose up -d mysql
```

Default local database values:

- Database: `tenant_living`
- Username: `tenant_living`
- Password: `tenant_living`
- Port: `3306`

Use `.env.example` as the template for local overrides.

## Runtime Profiles

The backend now has separate Spring profile files:

- `application-dev.yml` for local development with Docker MySQL defaults.
- `application-prod.yml` for production-style deployments using required environment variables.

The default profile is `dev`. Production deployments should set:

```bash
SPRING_PROFILES_ACTIVE=prod
```

## CORS

CORS is configured through application properties and wired into Spring Security.

Default local origins:

- `http://localhost:3000`
- `http://localhost:5173`

Use `APP_CORS_ALLOWED_ORIGINS` to override allowed frontend origins per environment.

## Testing Approach

Tests will be added with real feature development so coverage stays tied to production behavior.

## Logging

Every request gets a correlation ID.

- Incoming header: `X-Correlation-Id`
- Generated when missing
- Returned in the response header
- Added to MDC as `correlationId`
- Included in console logs

The header name can be changed with `APP_CORRELATION_HEADER_NAME`.

## Design Planning

Phase 2 planning has started with:

- `docs/SCHEMA_DESIGN.md`
- `docs/LOW_LEVEL_DESIGN.md`

## Current Scope Boundaries

The backend intentionally does not include:

- Business logic
- Domain entities
- Repositories
- Services
- Authentication workflows
- Property or room workflows

These will be added phase by phase.
