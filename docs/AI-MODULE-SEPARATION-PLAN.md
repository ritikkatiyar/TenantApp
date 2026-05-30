# AI Module Separation & Redis → Spring Events Migration Plan

This document summarizes the implementation plan to separate the AI module into a standalone Spring Boot service and to replace existing Redis pub/sub usage with Spring ApplicationEvents and `@EventListener` handlers.

## Goals
- Move AI processing into a dedicated, deployable service.
- Replace Redis pub/sub with in-process Spring events where appropriate.
- Preserve durability and failure semantics via optional persistence/queue fallback.
- Provide clear API/contract and secure inter-service communication.

## High-level Plan (steps)
1. Analyze current AI module and Redis usage
2. Define service boundaries and API contract
3. Scaffold new AI Spring Boot service
4. Extract AI logic and move code to new service
5. Replace Redis pub/sub with Spring ApplicationEvents and `@EventListener`
6. Implement persistence/queue fallback and error handling
7. Update inter-service communication (REST/gRPC) and auth
8. Add tests: unit, integration, and contract tests
9. Update CI, Dockerfiles, and `docker-compose`
10. Staged rollout, monitoring, and rollback plan

## Current status
- ✅ Step 1 complete: Redis + AI module inventory and risk assessment documented.
- ✅ Step 2 complete: service boundaries, API contract, and auth/routing plan defined.
- ✅ Step 3 complete: new AI service scaffold created and verified with Maven.
- 🔄 Step 4 in progress: extracting AI execution flow and wiring backend adapter / service delegation.
- ⬜ Step 5 waiting: replace Redis pub/sub with `ApplicationEvent` flow once extraction is complete.

## Further progress points for Step 1 (Analyze current AI module and Redis usage)
- Inventory files and classes that implement AI logic (service classes, wrappers, clients).
- Find all Redis interactions: publish/subscribe, keys, config properties, clients (Jedis/Lettuce/Redisson/Spring Data Redis).
- Map async vs sync flows: which operations expect immediate results vs eventual processing.
- Identify message formats (payload shapes), retry and duplicate handling, and TTLs.
- Note config keys, feature flags, and environment secrets used by AI code.
- Capture integration points (frontend, other backend services, cron jobs, batch jobs).
- Note monitoring/metrics and test coverage for current flows.

## Deliverables for Step 1
- A short report listing files and lines where Redis is used and where AI logic lives.
- A recommended list of events (domain event names and payload schemas) to implement in the new design.
- Preliminary risk assessment (durability, ordering, scaling, security).

## Notes
- This file is a working document; I'll update it with findings from code analysis.

## Initial Findings (Step 1)

- Redis configuration is present in: `backend/src/main/resources/application-dev.yml` and `backend/src/main/resources/application-prod.yml` (keys under `spring.redis`).
- Project declares `spring-boot-starter-data-redis` in `backend/pom.xml`.
- A Redis Streams-based consumer/producer is implemented in:
	- `backend/src/main/java/com/tenantliving/ai/config/RedisStreamConfig.java` — creates stream group and `StreamMessageListenerContainer` subscribing to `ai:commands:stream`.
	- `backend/src/main/java/com/tenantliving/ai/service/impl/AICommandServiceImpl.java` — publishes `StringRecord` messages to the Redis Stream (`opsForStream().add(record)`) in `queueCommand()` and handles job lifecycle in DB.
- AI execution and integration points:
	- `AICommandServiceImpl.executeAIJob(...)` performs background execution via `ChatClient` and sets up `SecurityContext` for the executing thread.
	- `AIJobTbl` entity and `AIJobRepository` persist job status/results (search under `com.tenantliving.ai.domain` and `repository`).
- Observations / risks to consider:
	- Current design relies on Redis Streams for background job delivery and consumer group semantics; replacing with in-process Spring events will change durability and consumer distribution semantics.
	- We must preserve job persistence and idempotency: the DB `AIJobTbl` is the canonical job store.
	- Security context population on background threads must be preserved when jobs move to a separate service.

## Next actions (Step 1 continuation)
- Enumerate all Redis-related classes and call sites (producers, consumers, stream keys).
- Identify the AI database entity and its schema (`AIJobTbl`) and test data flows for status transitions.
- Draft domain event schemas to replace current Redis message shapes (e.g., `AIJobCreated`, `AIJobCompleted`, `AIJobFailed`).

## Enumerated Redis / AI call sites (codewalk)

- `backend/src/main/java/com/tenantliving/ai/config/RedisStreamConfig.java` — creates stream group, `StreamMessageListenerContainer`, subscribes to `ai:commands:stream`.
- `backend/src/main/java/com/tenantliving/ai/listener/AICommandStreamListener.java` — Redis Streams `StreamListener` reading records, setting job status, calling `AICommandService.executeAIJob(...)`, acknowledging the record.
- `backend/src/main/java/com/tenantliving/ai/service/impl/AICommandServiceImpl.java` — publishes `StringRecord` to `ai:commands:stream` via `stringRedisTemplate.opsForStream().add(record)` in `queueCommand()`; also contains synchronous `handleCommand()` and background execution logic `executeAIJob(...)`.
- `backend/src/main/java/com/tenantliving/ai/domain/AIJobTbl.java` — JPA entity persisted in `ai_job_tbl` table; fields: `userId`, `prompt`, `status`, `response`, `errorMessage`.
- `backend/src/main/resources/application-dev.yml` & `application-prod.yml` — `spring.redis` configuration keys and environment wiring.
- `backend/pom.xml` — declares `spring-boot-starter-data-redis` dependency.

## Draft Domain Events (to replace Redis Stream messages)

Suggested event names and payloads (JSON examples):

- `AIJobCreated`
	- Purpose: emitted when an AI job is created and persisted (replaces Redis write from `queueCommand`).
	- Payload:
		{
			"jobId": "<uuid>",
			"prompt": "<string>",
			"userId": "<uuid>",
			"createdAt": "<iso8601>"
		}

- `AIJobProcessing`
	- Purpose: optional internal event indicating processing has started (used for metrics/notifications).
	- Payload: { "jobId": "<uuid>", "startedAt": "<iso8601>" }

- `AIJobCompleted`
	- Purpose: emitted when the AI provider returns a result.
	- Payload:
		{
			"jobId": "<uuid>",
			"response": "<string>",
			"completedAt": "<iso8601>"
		}

- `AIJobFailed`
	- Purpose: emitted when execution fails.
	- Payload:
		{
			"jobId": "<uuid>",
			"errorMessage": "<string>",
			"failedAt": "<iso8601>"
		}

Notes on mapping:
- The current Redis Stream record contains `jobId`, `prompt`, `userId`. The `AIJobCreated` event should carry the same minimum fields.
- In the separated service design, the producer (original backend) will call the AI service API to create a job (synchronous REST or gRPC). The AI service will persist the `AIJobTbl` equivalent and then publish `AIJobCreated` internally to trigger processing, or start processing immediately depending on config.
- Durable semantics: if you switch to Spring `ApplicationEvent` in-process, events are not durable across restarts; include a persistent DB-backed job table as the source-of-truth (already present) and consider a durable queue fallback (DB polling or external broker) for reliability.

## Service Boundaries & API Contract (Step 2)

Goal: define a minimal, secure contract so other services call the new AI service instead of writing to Redis.

Service responsibilities:
- Persist AI jobs and status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).
- Expose synchronous chat-style endpoint for immediate prompts (used by UI): returns AI response or an error.
- Expose asynchronous job creation endpoint for long-running tasks: create job, return jobId (no Redis required).
- Provide job status and result retrieval endpoints.
- Internally trigger processing via Spring `ApplicationEvent` and `@EventListener` handlers; offer optional async executor and durable fallback.
- Emit observable events (HTTP callbacks/webhooks or metrics) for external systems when a job completes/fails.

API endpoints (suggested)
- POST /api/v1/ai/commands  — synchronous chat call
	- Request: { "message": "..." }
	- Response 200: { "content": "<ai-response>", "metadata": {...} }
	- Errors: 503 when model unavailable, 400 for invalid input

- POST /api/v1/ai/jobs — create async AI job
	- Request: { "message": "...", "userId": "<uuid>" }
	- Response 202: { "jobId": "<uuid>", "status": "PENDING" }

- GET /api/v1/ai/jobs/{jobId} — get job status/result
	- Response 200: { "jobId": "..", "status": "COMPLETED|PENDING|PROCESSING|FAILED", "response": "...", "errorMessage": "..." }

- POST /api/v1/ai/webhooks/register (optional) — register callback URLs

DTOs (JSON shape)
- AICommandRequest
	- message: string

- AICommandResponse
	- content: string
	- metadata?: object

- AIJobCreateRequest
	- message: string
	- userId: string (uuid)

- AIJobCreateResponse
	- jobId: string (uuid)
	- status: string

- AIJobStatusResponse
	- jobId: string
	- status: string
	- response?: string
	- errorMessage?: string

Auth & security
- Use service-to-service auth for backend → AI service calls: prefer signed JWT (mTLS or mutual TLS if enforced). Tokens issued by internal auth service or shared key via Vault/KeyVault.
- Validate and scope user identity: the AI service may accept `userId` and should validate caller permissions for acting on behalf of that user.

Eventing & replacement for Redis
- Internal processing: use `ApplicationEvent` (custom `AIJobCreatedEvent`) to trigger processing within the AI service. This replaces the Redis consumer for in-service execution.
- Cross-service notifications: external systems should either poll `GET /api/v1/ai/jobs/{jobId}` or register webhooks; ApplicationEvents do not propagate across services.
- Durable fallback: because `ApplicationEvent` is in-memory, rely on persisted `ai_job_tbl` as the source of truth; on restart, the service can scan for `PENDING` jobs and re-emit events or resume processing.

Idempotency, retries, and error handling
- `AIJobCreate` must be idempotent for duplicate client calls (use `jobId` or idempotency key header). Persist only once.
- Processing should be retried with exponential backoff for transient errors; on repeated failures move to `FAILED` and emit `AIJobFailed`.
- Ensure `executeAIJob(...)` semantics are preserved: security context for the original user is reconstructed or the job explicitly stores required authorization claims.

Observability & metrics
- Expose metrics: job_created, job_processing, job_completed, job_failed, processing_latency.
- Add tracing (W3C trace context) for correlating across services.

Backend Adapter + Routing Plan
- Keep the backend as the request gateway during migration.
- Backend AI controller remains the public endpoint for clients.
- Backend will call `ai-service` over internal HTTP using a client such as `WebClient` or `FeignClient`.
- The backend keeps subscription checks and authorization rules in place before delegation.
- Backend should forward minimal user context, e.g. `X-User-Id` or a delegated JWT, while authenticating to `ai-service` with an internal service token.
- `ai-service` should trust the backend for policy enforcement, but still validate service auth and request shape.
- Response flow:
  - synchronous commands: backend proxies the AI service response back to caller
  - async jobs: backend proxies job creation and later proxies status requests or caches results if needed

Migration notes
- For the initial rollout, keep Redis available and add a compatibility shim: when `app.ai.remote.enabled=true`, `queueCommand()` calls the new AI service endpoint instead of adding to Redis; keep Redis code guarded behind `app.ai.enabled` feature flag during migration.
- Plan a data migration or reconciliation job: compare Redis stream / consumer ACKs vs DB entries to ensure no jobs are lost.



