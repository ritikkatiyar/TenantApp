package com.livic.auth.mapper;

import com.livic.auth.domain.MembershipTbl;
import com.livic.auth.dto.MembershipSummaryDTO;

public class MembershipMapper {

    private MembershipMapper() {
        // Private constructor to prevent instantiation
    }

    public static MembershipSummaryDTO toResponse(MembershipTbl m) {
        return toResponse(m, null);
    }

    public static MembershipSummaryDTO toResponse(MembershipTbl m, String propertyName) {
        if (m == null) {
            return null;
        }
        String rCode = m.getRole() != null ? m.getRole().getCode() : null;
        String rName = m.getRole() != null ? m.getRole().getName() : null;
        return new MembershipSummaryDTO(
                m.getId(),
                m.getPropertyId(),
                propertyName,
                m.getUserId(),
                rCode,
                rName
        );
    }
}
