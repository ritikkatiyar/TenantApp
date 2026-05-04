# Setup

## Local run

1. Start the database:
   ```bash
   docker compose up -d
   ```

2. Build the backend:
   ```bash
   mvn -f backend/pom.xml clean compile
   ```

3. Start the backend:
   ```bash
   mvn -f backend/pom.xml spring-boot:run
   ```

## Docker setup (MySQL)

The application uses a MySQL container defined in `docker-compose.yml`.
The service uses a named volume to store MySQL data.

If you need a fresh database, stop the compose stack and remove volumes:
```bash
docker compose down -v
```

## Flyway migration

Flyway migrations are located in `backend/src/main/resources/db/migration`.

On application startup, Flyway applies migrations automatically. The current clean initialization file is:

- `V1__init_schema.sql`

If you need to rerun migrations from scratch, remove the existing database and volume, then restart the application.
