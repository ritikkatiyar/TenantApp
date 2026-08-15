package com.livic.auth.dto;

import java.util.UUID;

public record MembershipSummaryDTO(
        UUID id,
        UUID propertyId,
        String propertyName,
        UUID userId,
        String roleCode,
        String roleName
) {}
