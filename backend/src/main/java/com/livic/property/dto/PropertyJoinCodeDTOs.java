package com.livic.property.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public class PropertyJoinCodeDTOs {

    public record GenerateJoinCodeRequest(
            @NotBlank String roleCode,
            @NotNull Integer maxUses
    ) {}

    public record ValidateJoinCodeRequest(
            @NotBlank String code
    ) {}

    public record JoinCodeResponse(
            UUID id,
            String code,
            String roleCode,
            String roleName,
            int maxUses,
            int usesCount,
            boolean isActive,
            Instant expiresAt
    ) {}

    public record JoinCodeResultResponse(
            UUID propertyId,
            String propertyName,
            String roleCode,
            UUID membershipId
    ) {}
}
