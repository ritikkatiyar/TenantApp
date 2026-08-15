package com.livic.property.service.interfaces;

import com.livic.property.dto.PropertyJoinCodeDTOs;
import com.livic.auth.dto.MembershipSummaryDTO;

import java.util.List;
import java.util.UUID;

public interface PropertyJoinCodeService {
    PropertyJoinCodeDTOs.JoinCodeResponse generateJoinCode(UUID propertyId, String roleCode, int maxUses, UUID actorId);
    
    List<PropertyJoinCodeDTOs.JoinCodeResponse> getPropertyJoinCodes(UUID propertyId);
    
    MembershipSummaryDTO validateAndApplyJoinCode(String code, UUID userId);

    PropertyJoinCodeDTOs.JoinCodeResultResponse validateAndApplyJoinCodeResult(String code, UUID userId);
}
