# Tenant Living Backend

## Overview

This repository contains the backend service for the Tenant Living modular monolith.
It provides authentication, user management, property management, unit leasing, rent cycles, and notification support.

## Tech stack

- Java 21
- Spring Boot 4.0.5
- Spring Data JPA
- Spring Security
- Flyway
- MySQL
- Lombok
- Springdoc OpenAPI

## How to run

1. Start MySQL using Docker Compose:
   ```bash
   docker compose up -d
   ```

2. Build the backend:
   ```bash
   mvn -f backend/pom.xml clean compile
   ```

3. Run the backend:
   ```bash
   mvn -f backend/pom.xml spring-boot:run
   ```

4. Verify the health endpoint:
   ```bash
   curl http://localhost:8080/health
   ```
