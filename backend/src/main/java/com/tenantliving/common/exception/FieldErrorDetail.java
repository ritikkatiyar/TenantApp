package com.tenantliving.common.exception;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Single field validation error")
public record FieldErrorDetail(
        @Schema(example = "email")
        String field,
        @Schema(example = "must be a well-formed email address")
        String message
) {
}
