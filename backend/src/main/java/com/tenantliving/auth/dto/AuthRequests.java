package com.tenantliving.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthRequests {

    private AuthRequests() {}

    @Schema(name = "SignupRequest", description = "Self-service registration (role fixed to USER server-side)")
    public record SignupRequest(
            @Schema(description = "Normalized to lowercase; stored as users.auth_uid", example = "tenant@example.com")
            @Email @NotBlank @Size(max = 255) String email,
            @Schema(description = "Minimum 8 characters", example = "securePass123", format = "password")
            @NotBlank @Size(min = 8, max = 128) String password,
            @Schema(example = "Ada Tenant")
            @NotBlank @Size(max = 255) String fullName,
            @Schema(example = "+919876543210")
            @Size(max = 20) String phoneNumber
    ) {}

    @Schema(name = "LoginRequest")
    public record LoginRequest(
            @Schema(example = "tenant@example.com")
            @Email @NotBlank @Size(max = 255) String email,
            @Schema(format = "password")
            @NotBlank @Size(max = 128) String password
    ) {}

    @Schema(name = "RefreshRequest", description = "Opaque refresh token from signup/login/refresh response")
    public record RefreshRequest(
            @Schema(description = "The refreshToken string (not the hash)")
            @NotBlank String refreshToken
    ) {}

    @Schema(name = "LogoutRequest", description = "Refresh token to revoke for the current session")
    public record LogoutRequest(
            @Schema(description = "The refreshToken string (not the hash)")
            @NotBlank String refreshToken
    ) {}

    @Schema(name = "ValidateRequest")
    public record ValidateRequest(
            @Schema(description = "JWT access token to introspect")
            @NotBlank String accessToken
    ) {}
}
