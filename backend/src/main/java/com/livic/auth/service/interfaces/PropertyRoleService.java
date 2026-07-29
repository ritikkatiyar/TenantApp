package com.livic.auth.service.interfaces;

import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.dto.RoleDTOs;

import java.util.List;
import java.util.UUID;

public interface PropertyRoleService {
    List<RoleDTOs.RoleResponse> getPropertyRoles(UUID propertyId);
    
    void toggleRoleActive(UUID propertyId, String roleCode, boolean active, UUID actorId);
    
    void updateRolePermissions(UUID propertyId, String roleCode, List<String> permissionCodes, UUID actorId);
    
    MembershipRoleTbl createCustomRole(UUID propertyId, RoleDTOs.CreateCustomRoleRequest request, UUID actorId);
}
