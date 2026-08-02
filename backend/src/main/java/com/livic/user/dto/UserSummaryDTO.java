package com.livic.user.dto;

import com.livic.common.domain.UserRole;
import com.livic.user.domain.UserTbl;

import java.util.UUID;

public record UserSummaryDTO(
        UUID id,
        String authUid,
        String fullName,
        String phoneNumber,
        UserRole globalRole
) {
    public static UserSummaryDTO from(UserTbl user) {
        if (user == null) {
            return null;
        }
        return new UserSummaryDTO(
                user.getId(),
                user.getAuthUid(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getGlobalRole()
        );
    }
}
