package com.tenantliving.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public final class AuthResponses {

    private AuthResponses() {}

    @Schema(name = "AuthUserSummary", description = "Subset of user fields for clients")
    public record AuthUserSummary(
            @Schema(description = "User UUID", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
            String id,
            @Schema(description = "Login email (auth_uid)", example = "tenant@example.com")
            String email,
            @Schema(example = "Ada Tenant")
            String fullName,
            @Schema(description = "UserRole enum name", example = "USER")
            String role
    ) {}

    @Schema(name = "TokenBundle", description = "Access JWT, rotated refresh token, and profile snapshot")
    public record TokenBundle(
            @Schema(description = "HS256 JWT; use as Bearer token")
            String accessToken,
            @Schema(description = "Opaque refresh token; store securely")
            String refreshToken,
            @Schema(example = "Bearer")
            String tokenType,
            @Schema(description = "Access token lifetime in seconds", example = "900")
            long expiresInSeconds,
            AuthUserSummary user
    ) {}

    @Schema(name = "ValidateResponse", description = "JWT introspection result")
    public record ValidateResponse(
            @Schema(description = "True if signature valid and not expired")
            boolean valid,
            @Schema(description = "JWT sub claim when valid", nullable = true)
            String userId,
            @Schema(nullable = true)
            String email,
            @Schema(nullable = true)
            String role,
            @Schema(description = "Unix seconds from JWT exp", nullable = true, example = "1715000000")
            Long expiresAtEpochSeconds,
            @Schema(description = "Reason when valid is false", nullable = true, example = "Token expired")
            String message
    ) {}
}
