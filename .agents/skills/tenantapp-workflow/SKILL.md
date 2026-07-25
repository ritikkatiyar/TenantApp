---
name: tenantapp-workflow
description: "Repository-specific development workflows, environment configuration, startup procedures, and architectural standards for TenantApp."
---

# TenantApp Development & Engineering Workflow

This skill guides you through running, debugging, and contributing to the TenantApp repository.

## 1. Local Development Server Execution

- **Command**: Run `.\dev.ps1 start` from the root directory to boot the MySQL database container, Spring Boot backend (port 8080), and Expo web frontend (port 3000).
- **Stopping Services**: Run `.\dev.ps1 stop` to shut down all processes and clear Docker compositions cleanly.
- **Expo Startup Fix**: Due to Node.js experimental fetch / undici version validation checks crashing, the Expo frontend must start with the `--offline` flag. The scripts `web` and `dev` in `TenantAppFE/package.json` include this parameter.

## 2. Engineering & Architecture Standards

Ensure any new backend development follows the bounded contexts and thin controller standards defined in `ENGINEERING_STANDARDS.md`:
- **Thin Controllers**: Controllers must only receive incoming REST API requests, map them to/from DTOs, and delegate all business coordination to Service components. No database transaction logic or JPA repositories should be directly injected into controllers.
- **Package-by-Feature (Bounded Contexts)**: Code is organized by feature area (e.g., `finance`, `properties`, `payment`, `user`). Never cross Bounded Context package boundaries (for example, finance modules shouldn't directly reference properties repositories). Use queries through the public Service interfaces instead.

## 3. Frontend UI Consistency

All React Native screens in `TenantAppFE` must align with `ui-consistency.md` and FAANG design standards:
- Reuse the common UI layout primitives: `PageShell`, `GlassCard`, `StatusPill`, `ActionButton`, and `EmptyState`.
- Never define inline ad-hoc layout styles when shared primitive elements are available.
