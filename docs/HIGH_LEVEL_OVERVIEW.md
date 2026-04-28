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
- Verified the project compiles with `mvn -f backend/pom.xml test`.

## Current Scope Boundaries

The backend intentionally does not include:

- Business logic
- Domain entities
- Repositories
- Services
- Authentication workflows
- Property or room workflows

These will be added phase by phase.

