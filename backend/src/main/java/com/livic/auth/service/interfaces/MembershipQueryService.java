package com.livic.auth.service.interfaces;

import com.livic.auth.domain.MembershipTbl;
import java.util.List;
import java.util.UUID;

public interface MembershipQueryService {
    List<MembershipTbl> getMembershipsByPropertyId(UUID propertyId);
    List<MembershipTbl> getMembershipsByUserId(UUID userId);
}
