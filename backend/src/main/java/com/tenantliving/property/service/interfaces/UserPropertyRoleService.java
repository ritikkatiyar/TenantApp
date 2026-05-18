package com.tenantliving.property.service.interfaces;

import com.tenantliving.property.domain.PropertyTbl;

import java.util.List;
import java.util.UUID;

public interface UserPropertyRoleService {
    List<PropertyTbl> getPropertiesByUserId(UUID userId);
    List<com.tenantliving.property.domain.UserPropertyRoleTbl> getRolesByUserId(UUID userId);
    void ensureTenantRole(UUID tenantId, UUID propertyId, UUID assignedByUserId);
    void removeTenantRole(UUID tenantId, UUID propertyId);
}
