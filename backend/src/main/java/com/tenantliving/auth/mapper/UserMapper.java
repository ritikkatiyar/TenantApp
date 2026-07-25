package com.tenantliving.auth.mapper;

import com.tenantliving.auth.dto.AuthRequests.SignupRequest;
import com.tenantliving.common.domain.UserRole;
import com.tenantliving.user.domain.UserTbl;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserTbl toEntity(SignupRequest request, String email, String phone, String passwordHash) {
        return UserTbl.builder()
                .authUid(email)
                .fullName(request.fullName().trim())
                .phoneNumber(phone)
                .passwordHash(passwordHash)
                .globalRole(UserRole.USER)
                .build();
    }
}
