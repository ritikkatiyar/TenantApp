package com.livic.property.service.interfaces;

import com.livic.property.domain.PropertyJoinCodeTbl;
import com.livic.property.dto.PropertyJoinCodeDTOs;
import com.livic.auth.domain.MembershipTbl;

import java.util.List;
import java.util.UUID;

public interface PropertyJoinCodeService {
    PropertyJoinCodeTbl generateJoinCode(UUID propertyId, String roleCode, int maxUses, UUID actorId);
    
    List<PropertyJoinCodeTbl> getPropertyJoinCodes(UUID propertyId);
    
    MembershipTbl validateAndApplyJoinCode(String code, UUID userId);

    PropertyJoinCodeDTOs.JoinCodeResultResponse validateAndApplyJoinCodeResult(String code, UUID userId);
}
