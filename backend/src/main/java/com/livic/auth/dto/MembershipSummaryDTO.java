package com.livic.auth.dto;

import com.livic.auth.domain.MembershipTbl;

import java.util.UUID;

public record MembershipSummaryDTO(
        UUID id,
        UUID propertyId,
        String propertyName,
        UUID userId,
        String roleCode,
        String roleName
) {
    public static MembershipSummaryDTO from(MembershipTbl m) {
        if (m == null) {
            return null;
        }
        String rCode = m.getRole() != null ? m.getRole().getCode() : null;
        String rName = m.getRole() != null ? m.getRole().getName() : null;
        return new MembershipSummaryDTO(
                m.getId(),
                m.getPropertyId(),
                null,
                m.getUserId(),
                rCode,
                rName
        );
    }
}
