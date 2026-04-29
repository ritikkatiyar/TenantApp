# Tenant Living Backend - Low Level Design

## Status

Status: Draft

This document will track module-level design decisions before implementation.

## Architecture Style

The backend follows a modular monolith structure.

Current base packages:

```text
com.tenantliving
|-- auth
|-- common
|-- config
|-- property
`-- room
```

## Module Structure Pattern

Each real module should generally follow this internal structure once implementation begins:

```text
module
|-- controller
|-- dto
|-- entity
|-- repository
|-- service
`-- mapper
```

This structure can be adjusted when a module is small enough that extra packages would add noise.

## Layer Responsibilities

### Controller

- Own HTTP endpoints.
- Accept and validate request DTOs.
- Return response DTOs.
- Avoid business logic.

### Service

- Own business rules.
- Own transaction boundaries.
- Coordinate repositories and module workflows.

### Repository

- Own persistence access.
- Use Spring Data JPA.
- Avoid business rules.

### Entity

- Represent persisted domain state.
- Avoid API-specific concerns.

### DTO

- Represent API input and output.
- Carry validation annotations where useful.

### Mapper

- Convert between entities and DTOs.
- Keep mapping explicit unless a mapper library is introduced later.

## Cross-Cutting Rules

- Use `BusinessException` for expected business/API errors.
- Use Flyway migrations for schema changes.
- Use validation annotations for request validation.
- Keep `/health` public.
- Keep module internals package-local where practical.
- Add tests with real feature implementation.

## Pending Design Discussions

- Auth API contract
- JWT versus session strategy
- Role and permission model
- Entity base class versus duplicated audit fields
- DTO naming convention
- Service transaction boundaries
- Whether to introduce MapStruct later

