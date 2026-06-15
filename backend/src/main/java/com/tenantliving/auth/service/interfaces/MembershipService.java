package com.tenantliving.auth.service.interfaces;

import java.util.UUID;

public interface MembershipService {
    void ensureTenantRole(UUID tenantId, UUID propertyId, UUID assignedByUserId);
    void removeTenantRole(UUID tenantId, UUID propertyId);
}
