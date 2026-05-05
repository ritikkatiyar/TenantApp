# Tenant Living Backend Phase-Wise Plan

## Goal

Build a production-grade Spring Boot backend for Tenant Living / Property Management incrementally, with each phase:

- complete
- testable
- production-ready
- limited to the scope defined for that phase

## Architecture

- Modular monolith
- Package-by-feature
- Layered structure: `controller → service → repository → domain`
- Modules:
  - `auth`
  - `user`
  - `user_property_role`
  - `property`
  - `unit`
  - `lease`
  - `rent_cycle`
  - `notification`

## Rules (Strict)

- Do NOT add marketplace/search
- Do NOT add payments integration
- Do NOT overengineer (no Kafka, no Redis)
- Each phase must compile and run before the next
- Use DTOs (no entity exposure)
- No cross-module repository access

## Deliverables per phase

1. APIs implemented
2. DB tables created
3. Code structure clean
4. Application runs successfully
5. APIs tested (Postman or equivalent)

---

## Phase 0: Foundation

### Tasks

- Ensure project builds: `mvn clean compile`
- Fix all compilation errors
- Configure MySQL + Flyway
- Create health endpoint: `GET /health`
- Standard API response wrapper
- Global exception handler

### Output

- Working application
- `/health` returns `{ "status": "UP" }`

---

## Phase 1: Auth + User

### Tasks

- User signup: `POST /auth/signup`
- User login: `POST /auth/login`
- JWT authentication
- Password hashing with BCrypt
- Create `user_tbl`
- Create `refreshtoken_tbl`

### Constraints

- No roles in `user_tbl`
- User = identity only

### Output

- User can signup/login
- JWT secured endpoints working

---

## Phase 2: Property + Role Assignment

### Tasks

- Create property: `POST /properties`
- Create `property_tbl`
- Create `user_property_role_tbl`
- On property creation:
  - assign OWNER role automatically

### Flow

User → create property → becomes OWNER

### Output

- Property created
- Role assigned correctly

---

## Phase 3: Unit Management

### Tasks

- Create unit: `POST /units`
- List units per property
- Create `unit_tbl`

### Unit must support

- `ROOM` / `BED` / `FLAT`
- `capacity`

### Output

- Property has units

---

## Phase 4: Lease (Core Logic)

### Tasks

- Create lease: `POST /leases`
- Create `lease_tbl`

### Logic

- Assign user to unit
- Define rent amount
- Define `move_in_date`
- `status = ACTIVE`

### Output

- User assigned to unit via lease

---

## Phase 5: Rent Cycle (Monthly Tracking)

### Tasks

- Create `rent_cycle_tbl`
- Generate monthly rent entries
- APIs:
  - `GET /rent-cycles`
  - `POST /rent-cycles/pay`

### Fields

- `month`
- `amount`
- `due_date`
- `status` (`PENDING` / `PAID` / `OVERDUE`)

### Output

- Monthly rent tracking works

---

## Phase 6: Notification (Basic)

### Tasks

- Create notification module
- Send reminders for:
  - due rent
  - overdue rent

### Output

- Basic notification flow

---

## Current status

- Phase 0: Foundation is implemented
- Phase 1: Auth + User is in progress

## Next step

- Complete Phase 1 fully, then move to Phase 2
