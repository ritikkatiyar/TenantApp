# Architecture

## Modular monolith design

The application is organized as a modular monolith. Each module owns its own domain, persistence, and service layer while sharing a single runtime and database.

Modules communicate through service interfaces and repository-backed domain objects. This keeps module boundaries clear while avoiding distributed system complexity.

## Modules

- `auth`
  - Responsible for authentication, JWT handling, and refresh token management.
- `user`
  - Manages identity, user profiles, roles, and user-specific data.
- `user_property_role`
  - Stores property role assignments for users across properties.
- `property`
  - Manages property entities, addresses, cities, and property ownership.
- `unit`
  - Defines units within properties and tracks unit properties such as capacity, floor, and facing.
- `lease`
  - Manages leases for users assigned to units, including lease status and dates.
- `rent_cycle`
  - Tracks rental cycles, amounts, due dates, and payment status for leases.
- `notification`
  - Handles communication and notification capabilities.

## Module responsibilities

- Each module owns its own domain entities and repository definitions.
- Business logic belongs in service implementations inside the owning module.
- Controllers expose module-specific endpoints and delegate to the service layer.

## Communication rules

- Modules communicate via service-to-service calls only.
- No direct controller-to-controller or repository-to-repository interactions are allowed.
- Shared domain objects should be minimal and limited to cross-module keys and IDs.
