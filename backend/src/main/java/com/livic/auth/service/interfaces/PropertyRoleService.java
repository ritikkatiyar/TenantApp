package com.livic.auth.service.interfaces;

import com.livic.auth.dto.RoleDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface PropertyRoleService {
    Page<RoleDTOs.RoleResponse> getPropertyRoles(UUID propertyId, Pageable pageable);
    
    void toggleRoleActive(UUID propertyId, String roleCode, boolean active, UUID actorId);
    
    void updateRolePermissions(UUID propertyId, String roleCode, List<String> permissionCodes, UUID actorId);
    
    RoleDTOs.RoleResponse createCustomRole(UUID propertyId, RoleDTOs.CreateCustomRoleRequest request, UUID actorId);
}
