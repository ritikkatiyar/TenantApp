package com.livic.property.service.interfaces;

import com.livic.property.dto.PropertyJoinCodeDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PropertyJoinCodeService {
    PropertyJoinCodeDTOs.JoinCodeResponse generateJoinCode(UUID propertyId, String roleCode, int maxUses, UUID actorId);
    Page<PropertyJoinCodeDTOs.JoinCodeResponse> getPropertyJoinCodes(UUID propertyId, Pageable pageable);
    PropertyJoinCodeDTOs.JoinCodeResultResponse validateAndApplyJoinCode(String code, UUID userId);
}
