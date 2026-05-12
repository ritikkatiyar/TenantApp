# TenantApp Dockerization & Production Guide

This document explains the technical implementation of the production-ready environment created for the TenantApp modular monolith.

## 1. Multi-Stage Dockerfile (`backend/Dockerfile`)
We used a **multi-stage build** to ensure the production image is as small and secure as possible.

*   **Stage 1 (Build)**: Uses a full Maven image to compile the code and create the `.jar` file.
*   **Stage 2 (Runtime)**: Uses a slim "JRE-only" image. We only copy the final `.jar` from Stage 1.
*   **Security**: The app runs under a non-root user (`spring`), which prevents an attacker from gaining full control of the container if they find a vulnerability.
*   **Optimization**: We included `JAVA_OPTS` to manage memory (`-Xmx512m`) so the app can run on free-tier servers without crashing.

## 2. Infrastructure Orchestration (`docker-compose.yml`)
Instead of starting the database and backend separately, Docker Compose manages the entire "stack" as one unit.

*   **Health Checks**: The backend is configured to wait until the MySQL database is "Healthy" before it attempts to start. This prevents "Connection Refused" errors during startup.
*   **Networking**: A private internal network (`tenant-network`) is created so the backend can talk to the database using the name `mysql` instead of an IP address.
*   **Persistence**: Database data is stored in a Docker Volume (`tenant_living_mysql_data`), so your data isn't lost when you stop the containers.

## 3. Production Configuration (`application-prod.yml`)
We separated the "Dev" and "Prod" settings:
*   **Dev**: Uses local H2/MySQL and shows human-readable logs.
*   **Prod**: Uses environment variables for all secrets (Database URL, JWT Secret) and switches to **Structured JSON Logging**.

## 4. Structured JSON Logging (`logback-spring.xml`)
In production, human-readable logs are hard for computers to search. We configured the app to output logs in **JSON format** when the `prod` profile is active. This allows professional monitoring tools (like ELK or Loki) to filter logs by `level`, `traceId`, or `application`.

## 5. Environment Variable Management (`.env.example`)
We created a template for all required production secrets. 

## 6. GitHub Actions CI/CD (`.github/workflows/ci-production.yml`)
This is the "Automation Robot." Every time you push code:
1.  It creates a fresh Ubuntu environment in the cloud.
2.  It compiles your Java code to catch syntax errors.
3.  It builds your Docker image to ensure the container is valid.
4.  It prepares the artifact for final deployment to a host like Render or Railway.

---

### How to run the production stack locally:
```bash
docker compose up --build -d
```
### How to view logs:
```bash
docker logs -f tenant-living-backend
```
