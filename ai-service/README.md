# Tenant Living AI Service

A lightweight Spring Boot service for AI job orchestration and processing.

## Run locally

```bash
cd ai-service
mvn spring-boot:run
```

## Build

```bash
cd ai-service
mvn -DskipTests package
```

## Docker

```bash
docker build -t tenant-living-ai-service:local ./ai-service
```

## Endpoints

- `POST /api/v1/ai/commands` - synchronous AI prompt handling
- `POST /api/v1/ai/jobs` - create async AI job
- `GET /api/v1/ai/jobs/{jobId}` - get job status and result
