package com.tenantliving.auth.service.interfaces;

import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface MembershipCrudService extends CrudService<MembershipTbl, UUID> {
    List<MembershipTbl> findByUserId(UUID userId);
    List<MembershipTbl> findByPropertyId(UUID propertyId);
    List<MembershipTbl> findByUserIdAndPropertyId(UUID userId, UUID propertyId);
    boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId);
    Set<String> findPermissionCodesByUserIdAndPropertyId(UUID userId, UUID propertyId);
    boolean existsByUserIdAndPropertyIdAndRoleCode(UUID userId, UUID propertyId, String roleCode);
    List<UUID> findPropertyIdsByUserId(UUID userId);
    List<MembershipTbl> findByPropertyIdAndRoleCode(UUID propertyId, String roleCode);
    void deleteByPropertyId(UUID propertyId);
}
