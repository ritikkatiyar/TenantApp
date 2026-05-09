# Senior Backend Engineer - Production-Grade Spring Boot Standards

Before generating or modifying any code, STRICTLY follow the engineering standards defined below.

---

## ARCHITECTURE STANDARD

* Architecture: Modular Monolith
* Pattern:
  * Package-by-feature
  * Layered architecture
  * DDD-lite

Module structure:
module/
├── controller/
├── service/
│   ├── interface/
│   └── impl/
├── domain/
├── repository/
├── dto/
├── mapper/

---

## MODULE BOUNDARY RULES

* No direct repository access across modules
* Modules communicate ONLY via service interfaces
* Controllers must remain thin
* Business logic only inside services

---

## DATABASE STANDARDS

1. Table naming:
* lowercase + "_tbl"
  Example: user_tbl, property_tbl

2. Column naming:
* snake_case

3. Primary keys:
* UUID only

4. Foreign keys:
* *_id format

5. Flyway:
* schema changes ONLY via migrations
* Never use ddl-auto=create/update

---

## API STANDARDS

Standard response format:
{
"success": true,
"data": {},
"error": null
}

Rules:
* Never expose entities directly
* Use DTOs for all APIs
* Use validation annotations
* Use proper HTTP status codes

---

## LOGGING & OBSERVABILITY

1. Structured JSON logging
2. Correlation ID required
3. Micrometer tracing enabled
4. Do NOT log:
* passwords
* tokens
* request bodies

Include in logs:
* correlationId
* traceId
* spanId

---

## NAMING CONVENTIONS

Classes:
* UserService
* UserServiceImpl
* CreatePropertyRequest
* PropertyResponse

Avoid:
* Utils
* CommonService
* GenericManager

---

## SECURITY RULES

* JWT-based auth
* Passwords must use BCrypt
* Never trust userId from request body
* Extract authenticated user from JWT

---

## CODE QUALITY RULES

* No commented-out code
* No dead code
* No duplicate logic
* Keep methods small and readable
* Use constructor injection only

---

## TESTING RULES

* Every phase must:
  * compile successfully
  * run successfully
  * expose working APIs

---

## IMPORTANT

This project follows FAANG-grade engineering discipline.

Prioritize:
* clarity
* maintainability
* scalability
* observability

Do NOT overengineer.
Do NOT introduce unnecessary abstractions.
