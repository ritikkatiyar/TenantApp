# Engineering Standards (Production-Grade Spring Boot)

This document defines the strict engineering standards for the **TenantApp** project. All code modifications and new feature implementations MUST adhere to these rules.

---

## 1. ARCHITECTURE & MODULE BOUNDARIES
*   **Pattern**: Modular Monolith using Package-by-Feature.
*   **Layering**: Controller -> Service (Interface) -> Service (Impl) -> Repository.
*   **Communication**: Modules communicate ONLY via Service Interfaces. No direct cross-module repository access.
*   **Thin Controllers**: Business logic must reside exclusively in the Service Layer.

## 2. DATABASE STANDARDS
*   **Naming**: Tables MUST end in `_tbl` (e.g., `user_tbl`). Columns use `snake_case`.
*   **Primary Keys**: Always use **UUID**.
*   **Migrations**: Schema changes are managed EXCLUSIVELY via **Flyway**. `ddl-auto` is strictly disabled for production.

## 3. API STANDARDS
*   **Response Format**: All APIs must return the standard envelope:
    ```json
    {
      "success": true,
      "data": {},
      "error": null
    }
    ```
*   **DTOs**: Never expose JPA Entities directly. Use DTOs for all request/response bodies.
*   **Validation**: Use `@Valid` and JSR-303 annotations.

## 4. LOGGING & OBSERVABILITY
*   **Format**: Structured JSON logging.
*   **Context**: Every log must include `correlationId`, `traceId`, and `spanId`.
*   **Privacy**: Never log sensitive data (passwords, tokens, full request bodies).

## 5. SECURITY & CODE QUALITY
*   **Auth**: JWT-based. Extract user context from the security context, never trust a `userId` passed in a request body.
*   **Passwords**: Always use **BCrypt**.
*   **Injection**: Use **Constructor Injection** exclusively (no `@Autowired` on fields).
*   **Clean Code**: No dead code, no commented-out code, and small, readable methods.

---

*This document is enforced by the Lead Engineer (Antigravity).*
