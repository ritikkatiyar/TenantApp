package com.livic.property.mapper;

import com.livic.property.domain.PropertyJoinCodeTbl;
import com.livic.property.dto.PropertyJoinCodeDTOs;

import java.util.UUID;

public class PropertyJoinCodeMapper {

    private PropertyJoinCodeMapper() {
        // Private constructor to prevent instantiation
    }

    public static PropertyJoinCodeDTOs.JoinCodeResponse toResponse(PropertyJoinCodeTbl jc, String roleCode, String roleName) {
        if (jc == null) {
            return null;
        }
        return new PropertyJoinCodeDTOs.JoinCodeResponse(
                jc.getId(),
                jc.getCode(),
                roleCode != null ? roleCode : "",
                roleName != null ? roleName : "",
                jc.getMaxUses(),
                jc.getUsesCount(),
                jc.isActive(),
                jc.getExpiresAt()
        );
    }

    public static PropertyJoinCodeDTOs.JoinCodeResultResponse toResultResponse(
            UUID propertyId,
            String propertyName,
            String roleCode,
            UUID membershipId
    ) {
        return new PropertyJoinCodeDTOs.JoinCodeResultResponse(
                propertyId,
                propertyName,
                roleCode,
                membershipId
        );
    }
}
