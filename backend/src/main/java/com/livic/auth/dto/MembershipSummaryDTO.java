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
        UUID propId = m.getProperty() != null ? m.getProperty().getId() : null;
        String propName = m.getProperty() != null ? m.getProperty().getName() : null;
        String rCode = m.getRole() != null ? m.getRole().getCode() : null;
        String rName = m.getRole() != null ? m.getRole().getName() : null;
        return new MembershipSummaryDTO(
                m.getId(),
                propId,
                propName,
                m.getUser() != null ? m.getUser().getId() : null,
                rCode,
                rName
        );
    }
}
