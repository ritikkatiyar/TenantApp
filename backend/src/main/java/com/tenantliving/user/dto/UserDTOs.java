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
}
