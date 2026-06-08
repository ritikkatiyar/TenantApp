package com.tenantliving.user.dto;

import com.tenantliving.common.domain.UserRole;

import java.util.UUID;

public class UserDTOs {

    public record UserSearchResponse(
            UUID id,
            String email,
            String fullName,
            String phoneNumber,
            UserRole globalRole
    ) {}

    public record CreateTenantRequest(
            @jakarta.validation.constraints.Email
            @jakarta.validation.constraints.NotBlank
            String email,

            @jakarta.validation.constraints.NotBlank
            String fullName,

            @jakarta.validation.constraints.NotBlank
            String phoneNumber
    ) {}
}
