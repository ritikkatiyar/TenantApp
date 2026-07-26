# TenantApp Developer Agent Guidelines

This document defines project-scoped rules for all AI coding agents working on the TenantApp codebase.

## 1. Feature Branch Workflow (Mandatory)

* **No Direct Commits to Main/Master**: You must NEVER make commits directly to `main` or `master` branches.
* **Feature Branches**: All new features, refactoring, bug fixes, and modifications must be developed in a dedicated feature branch.
  * Branch naming pattern: `feature/<feature-name>` or `bugfix/<bug-description>` (e.g., `feature/pr-review-agent`).
* **Pull Requests**: Once your changes are complete, the workspace workflow relies on Pull Requests. Opening a Pull Request triggers the automated CI/CD pipeline and the **PR Review Agent** which verifies code quality and architecture alignment against backend and frontend skills.

## 2. Review and Verification

* Ensure that all changes are self-contained.
* Make sure that your changes do not violate `backend-engineering` or `frontend-quality` standards before asking the user to review.
