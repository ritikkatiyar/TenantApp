package com.tenantliving.common.exception;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Standard JSON error envelope from GlobalExceptionHandler")
public record ApiError(
        @Schema(description = "RFC-3339 instant", example = "2026-05-03T10:15:30.00Z")
        Instant timestamp,
        @Schema(example = "409")
        int status,
        @Schema(example = "Conflict")
        String error,
        @Schema(example = "Email already registered")
        String message,
        @Schema(example = "/api/v1/auth/signup")
        String path,
        @Schema(description = "Populated for validation failures")
        List<FieldErrorDetail> fieldErrors
) {

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(Instant.now(), status, error, message, path, List.of());
    }

    public static ApiError withFieldErrors(
            int status,
            String error,
            String message,
            String path,
            List<FieldErrorDetail> fieldErrors
    ) {
        return new ApiError(Instant.now(), status, error, message, path, List.copyOf(fieldErrors));
    }
}
