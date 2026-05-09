# Auth Flow

TenantApp uses short-lived JWT access tokens plus rotating refresh tokens.

## Endpoints

- `POST /api/v1/auth/signup`
  - Creates a user and returns a token bundle.
- `POST /api/v1/auth/login`
  - Authenticates with email/password and returns a token bundle.
- `POST /api/v1/auth/refresh`
  - Consumes the current refresh token and returns a new access/refresh pair.
- `POST /api/v1/auth/logout`
  - Revokes the provided refresh token for the current session.
- `POST /api/v1/auth/validate`
  - Validates an access token and returns validity metadata.
- `GET /api/v1/auth/me`
  - Returns the current authenticated user summary.

## Frontend Behavior

- Login/signup stores the token bundle through `AuthProvider`.
- Web stores the bundle in `localStorage`.
- Native stores the bundle in `expo-secure-store`.
- Logout clears local storage and asks the backend to revoke the refresh token.
- Refresh is exposed through `refreshSession()` on `useAuth()`.

## Local Development

Run the full stack from the repository root:

```powershell
.\dev.cmd
```

Then open:

- Frontend: `http://localhost:3000`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
