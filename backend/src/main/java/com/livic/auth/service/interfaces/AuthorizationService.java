package com.livic.auth.service.interfaces;

import com.livic.storage.dto.OwnerModule;

import java.util.UUID;


public interface AuthorizationService {
    boolean hasPermission(UUID propertyId, String permissionCode);
    boolean hasAnyPermission(UUID propertyId, String... permissionCodes);
    boolean hasRole(UUID propertyId, String roleCode);
    boolean hasAnyRole(UUID propertyId, String... roleCodes);

    boolean hasPermissionByUnitId(UUID unitId, String permissionCode);
    boolean hasPermissionByLeaseId(UUID leaseId, String permissionCode);
    boolean hasPermissionByAssignmentId(UUID assignmentId, String permissionCode);
    boolean hasPermissionByItemId(UUID itemId, String permissionCode);
    boolean hasPermissionByRentCycleId(UUID rentCycleId, String permissionCode);

    boolean hasMediaAccess(OwnerModule ownerModule, UUID referenceId, String action);
    boolean hasMediaAssetAccess(UUID mediaAssetId, String action);
}

