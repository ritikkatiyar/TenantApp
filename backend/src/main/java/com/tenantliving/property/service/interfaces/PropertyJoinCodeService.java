package com.tenantliving.property.service.interfaces;

import com.tenantliving.property.domain.PropertyJoinCodeTbl;
import com.tenantliving.auth.domain.MembershipTbl;

import java.util.List;
import java.util.UUID;

public interface PropertyJoinCodeService {
    PropertyJoinCodeTbl generateJoinCode(UUID propertyId, String roleCode, int maxUses, UUID actorId);
    
    List<PropertyJoinCodeTbl> getPropertyJoinCodes(UUID propertyId);
    
    MembershipTbl validateAndApplyJoinCode(String code, UUID userId);
}
