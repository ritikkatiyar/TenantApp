package com.livic.auth.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class MembershipDTOs {

    public record MembershipResponse(
            UUID id,
            UUID userId,
            String fullName,
            String email,
            String roleCode,
            String roleName
    ) {}

    public record AssignRoleRequest(
            @NotNull UUID userId,
            @NotNull String roleCode
    ) {}

    public record TransferOwnershipRequest(
            @NotNull UUID toUserId
    ) {}
}
