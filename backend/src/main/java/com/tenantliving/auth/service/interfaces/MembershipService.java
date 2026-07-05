package com.tenantliving.auth.service.interfaces;

import com.tenantliving.auth.domain.MembershipTbl;
import java.util.UUID;

public interface MembershipService {
    void ensureTenantRole(UUID tenantId, UUID propertyId, UUID assignedByUserId);
    void removeTenantRole(UUID tenantId, UUID propertyId);
    
    void createOwnerMembership(UUID propertyId, UUID ownerId);
    
    MembershipTbl assignRole(UUID propertyId, UUID userId, String roleCode, UUID assignedByUserId);
    
    void removeRole(UUID propertyId, UUID membershipId);
    
    void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId);
}
