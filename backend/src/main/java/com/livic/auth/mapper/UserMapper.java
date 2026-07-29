package com.livic.auth.mapper;

import com.livic.auth.dto.AuthRequests.SignupRequest;
import com.livic.common.domain.UserRole;
import com.livic.user.domain.UserTbl;

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
