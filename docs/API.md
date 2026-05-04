# API Reference

## Authentication

### `POST /auth/signup`

Register a new user account.

#### Request
```json
{
  "authUid": "tenant@example.com",
  "password": "P@ssw0rd",
  "fullName": "Tenant User"
}
```

#### Response
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<refresh_token>",
  "expiresInMs": 900000
}
```

### `POST /auth/login`

Authenticate an existing user.

#### Request
```json
{
  "authUid": "tenant@example.com",
  "password": "P@ssw0rd"
}
```

#### Response
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<refresh_token>",
  "expiresInMs": 900000
}
```

### `GET /auth/me`

Returns the authenticated user profile.

#### Response
```json
{
  "id": "<uuid>",
  "authUid": "tenant@example.com",
  "fullName": "Tenant User",
  "phoneNumber": null,
  "role": "USER"
}
```

## Health

### `GET /health`

Returns service health status.

#### Response
```json
{
  "status": "UP"
}
```
