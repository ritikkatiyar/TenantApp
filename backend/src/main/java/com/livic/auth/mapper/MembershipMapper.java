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
        return new MembershipSummaryDTO(
                m.getId(),
                m.getPropertyId(),
                propertyName,
                m.getUserId(),
                m.getTitle(),
                m.getAccessType(),
                m.isActive()
        );
    }
}
