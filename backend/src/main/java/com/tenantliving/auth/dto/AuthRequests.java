package com.tenantliving.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthRequests {

    private AuthRequests() {}

        public record SignupRequest(
                        @Email @NotBlank @Size(max = 255) String email,
                        @NotBlank @Size(min = 8, max = 128) String password,
                        @NotBlank @Size(max = 255) String fullName,
                        @Size(max = 20) String phoneNumber
    ) {}

        public record LoginRequest(
                        @Email @NotBlank @Size(max = 255) String email,
                        @NotBlank @Size(max = 128) String password
    ) {}

        public record RefreshRequest(
                        @NotBlank String refreshToken
    ) {}

        public record LogoutRequest(
                        @NotBlank String refreshToken
    ) {}

        public record ValidateRequest(
                        @NotBlank String accessToken
    ) {}
}
