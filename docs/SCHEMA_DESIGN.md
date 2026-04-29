# Tenant Living Backend - Schema Design

## Status

Status: Draft

This document will track database schema decisions before implementation. No domain tables have been created yet.

## Design Principles

- Flyway owns schema changes.
- Hibernate runs with `ddl-auto: validate`.
- Tables should use stable primary keys.
- All production tables should include audit fields where appropriate.
- Schema decisions should be finalized before entities are added.

## Initial Domain Areas

### Auth and Identity

To discuss:

- User/account table shape
- Login identifier: email, phone, or both
- Password storage strategy
- Account status values
- Roles and permissions model
- Tenant/user profile separation if needed

### Property

To discuss:

- Property ownership model
- Address fields
- Property status values
- Whether a property can have multiple owners/managers

### Room

To discuss:

- Room relationship to property
- Room type/category
- Rent amount and billing metadata
- Availability status
- Occupancy rules

### Tenant Assignment

To discuss:

- Tenant to room assignment model
- Move-in and move-out dates
- Active versus historical assignments
- Deposit and rent tracking boundaries

## Candidate Base Columns

Common columns likely needed on most domain tables:

```text
id
created_at
updated_at
created_by
updated_by
```

Final types and constraints are pending.

## Pending Decisions

- Primary key type
- Naming convention for tables and columns
- Audit strategy
- Soft delete strategy
- Role model
- Initial auth schema
- Property and room cardinality rules

