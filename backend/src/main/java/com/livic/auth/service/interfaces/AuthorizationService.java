package com.livic.auth.service.interfaces;

import java.util.UUID;

public interface AuthorizationService {
    boolean hasPermission(UUID propertyId, String permissionCode);
    boolean hasAnyPermission(UUID propertyId, String... permissionCodes);
    boolean hasRole(UUID propertyId, String roleCode);
    boolean hasAnyRole(UUID propertyId, String... roleCodes);

    boolean hasPermissionByUnitId(UUID unitId, String permissionCode);
    boolean hasPermissionByLeaseId(UUID leaseId, String permissionCode);
    boolean hasPermissionByAssignmentId(UUID assignmentId, String permissionCode);
    boolean hasPermissionByRentCycleId(UUID rentCycleId, String permissionCode);
    boolean hasPermissionByChargeConfigId(UUID chargeConfigId, String permissionCode);
}
