package com.livic.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class RoleDTOs {

    public record RoleResponse(
            UUID id,
            String code,
            String name,
            String description,
            int roleRank,
            boolean isActive,
            List<String> permissionCodes
    ) {}

    public record UpdateRolePermissionsRequest(
            @NotEmpty List<String> permissionCodes
    ) {}

    public record CreateCustomRoleRequest(
            @NotBlank String name,
            String description,
            List<String> permissionCodes
    ) {}
}
